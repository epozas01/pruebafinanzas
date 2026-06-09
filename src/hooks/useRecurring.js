import { useState, useEffect } from 'react'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase'

export function nextOccurrence(dateStr, frequency) {
  const d = new Date(dateStr + 'T12:00:00')
  if (frequency === 'daily')   d.setDate(d.getDate() + 1)
  if (frequency === 'weekly')  d.setDate(d.getDate() + 7)
  if (frequency === 'monthly') d.setMonth(d.getMonth() + 1)
  if (frequency === 'yearly')  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

export function useRecurring(uid) {
  const [recurring, setRecurring] = useState([])

  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, `users/${uid}/recurring`), orderBy('createdAt', 'asc'))
    return onSnapshot(q,
      snap => setRecurring(snap.docs.map(d => ({ ...d.data(), id: d.id }))),
      err  => console.error('Recurring snapshot error:', err),
    )
  }, [uid])

  async function addRecurring(data) {
    await addDoc(collection(db, `users/${uid}/recurring`), { ...data, createdAt: Date.now() })
  }

  async function updateRecurring(id, data) {
    await updateDoc(doc(db, `users/${uid}/recurring`, id), data)
  }

  async function deleteRecurring(id) {
    await deleteDoc(doc(db, `users/${uid}/recurring`, id))
  }

  return { recurring, addRecurring, updateRecurring, deleteRecurring }
}
