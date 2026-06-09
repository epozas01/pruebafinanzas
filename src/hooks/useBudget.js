import { useState, useEffect } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

export function useBudget(uid) {
  const [budgets, setBudgets] = useState({})

  useEffect(() => {
    if (!uid) return
    return onSnapshot(doc(db, `users/${uid}/settings/budget`), snap => {
      if (snap.exists()) setBudgets(snap.data())
    })
  }, [uid])

  async function setBudgetLimit(categoryId, amount) {
    await setDoc(
      doc(db, `users/${uid}/settings/budget`),
      { [categoryId]: amount },
      { merge: true },
    )
  }

  return { budgets, setBudgetLimit }
}
