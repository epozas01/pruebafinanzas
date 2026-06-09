import { useState, useEffect } from 'react'
import { db } from '../firebase'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy,
} from 'firebase/firestore'

export function usePortfolio(uid) {
  const [holdings, setHoldings] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!uid) return
    const q = query(
      collection(db, 'users', uid, 'portfolio'),
      orderBy('addedAt', 'asc'),
    )
    return onSnapshot(q, snap => {
      setHoldings(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [uid])

  async function addHolding(data) {
    return addDoc(collection(db, 'users', uid, 'portfolio'), {
      ...data, addedAt: serverTimestamp(),
    })
  }

  async function updateHolding(id, data) {
    const { id: _id, addedAt, ...rest } = data
    return updateDoc(doc(db, 'users', uid, 'portfolio', id), rest)
  }

  async function deleteHolding(id) {
    return deleteDoc(doc(db, 'users', uid, 'portfolio', id))
  }

  return { holdings, loading, addHolding, updateHolding, deleteHolding }
}
