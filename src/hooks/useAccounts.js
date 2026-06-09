import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, addDoc, deleteDoc,
  updateDoc, doc, query, orderBy,
} from 'firebase/firestore'
import { db } from '../firebase'

export function useAccounts(uid) {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!uid) return
    const q = query(
      collection(db, `users/${uid}/accounts`),
      orderBy('createdAt', 'asc'),
    )
    return onSnapshot(q,
      snap => {
        setAccounts(snap.docs.map(d => ({ ...d.data(), id: d.id })))
        setLoading(false)
      },
      err => {
        console.error('Accounts Firestore error:', err.code, err.message)
        setLoading(false)
      },
    )
  }, [uid])

  async function addAccount(account) {
    await addDoc(collection(db, `users/${uid}/accounts`), {
      ...account,
      createdAt: Date.now(),
    })
  }

  async function updateAccount(id, updates) {
    await updateDoc(doc(db, `users/${uid}/accounts`, id), updates)
  }

  async function deleteAccount(id) {
    await deleteDoc(doc(db, `users/${uid}/accounts`, id))
  }

  return { accounts, loading, addAccount, updateAccount, deleteAccount }
}
