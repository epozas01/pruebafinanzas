import { useState, useEffect } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { EXPENSE_CATEGORIES } from '../data/categories'

export function useBudgetCategories(uid) {
  const [categories, setCategories] = useState(null) // null = loading

  useEffect(() => {
    if (!uid) return
    return onSnapshot(
      doc(db, `users/${uid}/settings/budgetCategories`),
      snap => {
        const list = snap.exists() && snap.data().list
        setCategories(list?.length > 0 ? list : EXPENSE_CATEGORIES)
      },
      err => {
        console.error('Budget categories error:', err)
        setCategories(EXPENSE_CATEGORIES)
      },
    )
  }, [uid])

  async function saveCategories(list) {
    await setDoc(doc(db, `users/${uid}/settings/budgetCategories`), { list })
  }

  async function addCategory(cat) {
    await saveCategories([...(categories || EXPENSE_CATEGORIES), cat])
  }

  async function removeCategory(id) {
    await saveCategories((categories || EXPENSE_CATEGORIES).filter(c => c.id !== id))
  }

  return {
    categories: categories || EXPENSE_CATEGORIES,
    loading: categories === null,
    addCategory,
    removeCategory,
  }
}
