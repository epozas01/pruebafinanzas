import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, addDoc, deleteDoc,
  doc, query, orderBy,
} from 'firebase/firestore'
import { db } from '../firebase'

export function useTransactions(uid) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) return
    const q = query(
      collection(db, `users/${uid}/transactions`),
      orderBy('createdAt', 'desc'),
    )
    return onSnapshot(q, snap => {
      setTransactions(snap.docs.map(d => ({ ...d.data(), id: d.id })))
      setLoading(false)
    })
  }, [uid])

  async function addTransaction(tx) {
    await addDoc(collection(db, `users/${uid}/transactions`), {
      ...tx,
      createdAt: Date.now(),
    })
  }

  async function deleteTransaction(id) {
    await deleteDoc(doc(db, `users/${uid}/transactions`, id))
  }

  return { transactions, loading, addTransaction, deleteTransaction }
}
