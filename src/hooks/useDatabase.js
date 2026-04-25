import { useState, useEffect } from 'react';
import { DB_SCHEMA, DB_SEED } from '../data/dbSchema';

let dbInstance = null;
let dbInitPromise = null;

export function useDatabase() {
  const [ready, setReady] = useState(!!dbInstance);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (dbInstance) { setReady(true); return; }
    if (!dbInitPromise) {
      dbInitPromise = (async () => {
        const SQL = await window.initSqlJs({
          locateFile: (f) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/${f}`,
        });
        const db = new SQL.Database();
        db.run(DB_SCHEMA);
        db.run(DB_SEED);
        dbInstance = db;
        return db;
      })();
    }
    dbInitPromise.then(() => setReady(true)).catch((e) => setError(e.message));
  }, []);

  /** Run a SELECT query and return { columns, rows } */
  const runQuery = (sql) => {
    if (!dbInstance) throw new Error('Database not ready');
    const trimmed = sql.trim();
    if (!trimmed) throw new Error('Please enter a SQL query.');
    const upper = trimmed.toUpperCase().replace(/\s+/g, ' ');
    if (!upper.startsWith('SELECT') && !upper.startsWith('WITH'))
      throw new Error('Only SELECT and WITH (CTE) queries are allowed here.');
    const results = dbInstance.exec(trimmed);
    if (!results.length) return { columns: [], rows: [] };
    const { columns, values } = results[0];
    return { columns, rows: values };
  };

  /**
   * CRITICAL VALIDATION FIX
   * Execute both user query AND the reference answer, then compare result sets.
   * Returns { correct, reason, userResult, expectedResult }
   */
  const validateAgainstAnswer = (userSql, answerSql) => {
    if (!dbInstance) throw new Error('Database not ready');

    let userResult, expectedResult;

    // Run user query
    try {
      userResult = runQuery(userSql.trim());
    } catch (e) {
      return { correct: false, reason: `Your query has an error: ${e.message}`, userResult: null, expectedResult: null };
    }

    // Run reference answer
    try {
      const res = dbInstance.exec(answerSql.trim());
      if (!res.length) {
        expectedResult = { columns: [], rows: [] };
      } else {
        expectedResult = { columns: res[0].columns, rows: res[0].values };
      }
    } catch (e) {
      // fallback: if answer itself fails (shouldn't happen), skip comparison
      return { correct: false, reason: 'Internal validation error.', userResult, expectedResult: null };
    }

    // ── Compare result sets ───────────────────────────────
    const u = userResult;
    const e = expectedResult;

    // 1. Same row count
    if (u.rows.length !== e.rows.length) {
      return {
        correct: false,
        reason: `Expected ${e.rows.length} row${e.rows.length !== 1 ? 's' : ''}, but got ${u.rows.length}.`,
        userResult: u, expectedResult: e,
      };
    }

    // 2. Same column count
    if (u.columns.length !== e.columns.length) {
      return {
        correct: false,
        reason: `Expected ${e.columns.length} column${e.columns.length !== 1 ? 's' : ''}, but got ${u.columns.length}.`,
        userResult: u, expectedResult: e,
      };
    }

    // 3. Compare data — normalize values (stringify, trim, lowercase for comparison)
    const normalizeVal = (v) => {
      if (v === null || v === undefined) return '__null__';
      return String(v).trim().toLowerCase();
    };

    // Sort both result sets the same way so order differences are forgiven
    const sortRows = (rows) =>
      [...rows].sort((a, b) => {
        const aStr = a.map(normalizeVal).join('|');
        const bStr = b.map(normalizeVal).join('|');
        return aStr.localeCompare(bStr);
      });

    const uSorted = sortRows(u.rows);
    const eSorted = sortRows(e.rows);

    for (let i = 0; i < uSorted.length; i++) {
      const uRow = uSorted[i];
      const eRow = eSorted[i];
      for (let j = 0; j < eRow.length; j++) {
        const uVal = normalizeVal(uRow[j]);
        const eVal = normalizeVal(eRow[j]);
        // Allow slight float differences (round to 2dp for comparison)
        const uNum = parseFloat(uRow[j]);
        const eNum = parseFloat(eRow[j]);
        const bothNumbers = !isNaN(uNum) && !isNaN(eNum);
        const numbersMatch = bothNumbers && Math.abs(uNum - eNum) < 0.015;
        if (uVal !== eVal && !numbersMatch) {
          return {
            correct: false,
            reason: `Data mismatch in row ${i + 1}: expected "${eRow[j]}" but got "${uRow[j]}".`,
            userResult: u, expectedResult: e,
          };
        }
      }
    }

    return { correct: true, reason: 'Perfect match!', userResult: u, expectedResult: e };
  };

  return { ready, error, runQuery, validateAgainstAnswer };
}
