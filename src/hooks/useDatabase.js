import { useState, useEffect } from 'react';
import { DB_SCHEMA, DB_SEED } from '../data/dbSchema';

let dbInstance = null;
let dbInitPromise = null;

export function useDatabase() {
  const [ready, setReady] = useState(!!dbInstance);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const initDB = async () => {
      try {
        if (dbInstance) {
          if (!cancelled) setReady(true);
          return;
        }

        if (!dbInitPromise) {
          dbInitPromise = (async () => {
            if (!window.initSqlJs) {
              throw new Error('SQL.js is not loaded on window');
            }

            const SQL = await window.initSqlJs({
              locateFile: (file) =>
                `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/${file}`,
            });

            const db = new SQL.Database();

            db.run(DB_SCHEMA);
            db.run(DB_SEED);

            dbInstance = db;
            return db;
          })();
        }

        await dbInitPromise;

        if (!cancelled) setReady(true);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Database init failed');
      }
    };

    initDB();

    return () => {
      cancelled = true;
    };
  }, []);

  // ─────────────────────────────────────────────
  // RUN QUERY (SAFE)
  // ─────────────────────────────────────────────
  const runQuery = (sql) => {
    if (!dbInstance) throw new Error('Database not ready');

    const trimmed = sql?.trim();
    if (!trimmed) throw new Error('Please enter a SQL query.');

    const upper = trimmed.toUpperCase().replace(/\s+/g, ' ');

    if (!upper.startsWith('SELECT') && !upper.startsWith('WITH')) {
      throw new Error('Only SELECT and WITH (CTE) queries are allowed.');
    }

    try {
      const results = dbInstance.exec(trimmed);

      if (!results.length) return { columns: [], rows: [] };

      const { columns, values } = results[0];

      return { columns, rows: values };
    } catch (e) {
      throw new Error(`SQL Error: ${e.message}`);
    }
  };

  // ─────────────────────────────────────────────
  // VALIDATION ENGINE (IMPROVED)
  // ─────────────────────────────────────────────
  const validateAgainstAnswer = (userSql, answerSql) => {
    if (!dbInstance) throw new Error('Database not ready');

    let userResult, expectedResult;

    // USER QUERY
    try {
      userResult = runQuery(userSql);
    } catch (e) {
      return {
        correct: false,
        reason: `Your query has an error: ${e.message}`,
        userResult: null,
        expectedResult: null,
      };
    }

    // ANSWER QUERY
    try {
      const res = dbInstance.exec(answerSql);

      expectedResult = !res.length
        ? { columns: [], rows: [] }
        : { columns: res[0].columns, rows: res[0].values };
    } catch (e) {
      return {
        correct: false,
        reason: 'Internal validation error',
        userResult,
        expectedResult: null,
      };
    }

    const u = userResult;
    const e = expectedResult;

    // ROW COUNT
    if (u.rows.length !== e.rows.length) {
      return {
        correct: false,
        reason: `Expected ${e.rows.length} rows, but got ${u.rows.length}.`,
        userResult: u,
        expectedResult: e,
      };
    }

    // COLUMN COUNT
    if (u.columns.length !== e.columns.length) {
      return {
        correct: false,
        reason: `Expected ${e.columns.length} columns, but got ${u.columns.length}.`,
        userResult: u,
        expectedResult: e,
      };
    }

    // NORMALIZER
    const normalize = (v) =>
      v === null || v === undefined
        ? '__null__'
        : String(v).trim().toLowerCase();

    const sortRows = (rows) =>
      [...rows].sort((a, b) =>
        a.map(normalize).join('|').localeCompare(b.map(normalize).join('|'))
      );

    const uSorted = sortRows(u.rows);
    const eSorted = sortRows(e.rows);

    // COMPARE DATA
    for (let i = 0; i < uSorted.length; i++) {
      for (let j = 0; j < uSorted[i].length; j++) {
        const uVal = normalize(uSorted[i][j]);
        const eVal = normalize(eSorted[i][j]);

        const uNum = parseFloat(uSorted[i][j]);
        const eNum = parseFloat(eSorted[i][j]);

        const isNum = !isNaN(uNum) && !isNaN(eNum);
        const numMatch = isNum && Math.abs(uNum - eNum) < 0.015;

        if (uVal !== eVal && !numMatch) {
          return {
            correct: false,
            reason: `Mismatch at row ${i + 1}: expected "${eSorted[i][j]}" but got "${uSorted[i][j]}"`,
            userResult: u,
            expectedResult: e,
          };
        }
      }
    }

    return {
      correct: true,
      reason: 'Perfect match!',
      userResult: u,
      expectedResult: e,
    };
  };

  return {
    ready,
    error,
    runQuery,
    validateAgainstAnswer,
  };
}
