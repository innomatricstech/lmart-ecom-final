import React, { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../../firebase'

const NewsToday = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [newsArticles, setNewsArticles] = useState([])
  const [categories, setCategories] = useState(['all'])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedArticle, setSelectedArticle] = useState(null)

  // 🔹 FORMAT DATE
  const formatDate = (dateInput) => {
    if (!dateInput) return '2024-01-01'
    if (dateInput?.toDate)
      return dateInput.toDate().toISOString().split('T')[0]
    return dateInput
  }

  // 🔹 FETCH NEWS + CATEGORIES
  useEffect(() => {
    const newsCollection = collection(db, 'news')
    const q = query(newsCollection, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const articles = querySnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            title: data.title || 'Untitled',
            excerpt: data.excerpt || '',
            content: data.content || data.excerpt || '',
            category: data.category || 'General', // ✅ DYNAMIC CATEGORY
            author: data.author || 'Admin',
            date: formatDate(data.createdAt || data.date),
            image:
              data.imageUrl ||
              'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=400&fit=crop',
            createdAt: data.createdAt,
          }
        })

        setNewsArticles(articles)

        // ✅ UNIQUE CATEGORIES FOR NAVBAR
        const uniqueCategories = [
          'all',
          ...new Set(articles.map((a) => a.category).filter(Boolean)),
        ]

        setCategories(uniqueCategories)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error(err)
        setError('Failed to load news')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  // 🔹 FILTER LOGIC
  const filtered = newsArticles.filter((a) => {
    const matchCategory =
      selectedCategory === 'all' || a.category === selectedCategory

    const matchSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.content.toLowerCase().includes(searchTerm.toLowerCase())

    return matchCategory && matchSearch
  })

  // 🔹 LOADING
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* 🔹 CATEGORY NAVBAR */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-full mx-auto px-4 py-3">
          <div className="flex overflow-x-auto space-x-2 scrollbar-hide">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === c
                    ? 'bg-purple-600 text-white shadow'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {c === 'all' ? 'All News' : c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 🔹 CONTENT */}
      <div className="max-w-full mx-auto px-5 py-6">

        {/* TITLE */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {selectedCategory === 'all'
              ? 'Latest Articles'
              : `${selectedCategory} Articles`}
            <span className="ml-2 text-purple-600">
              ({filtered.length})
            </span>
          </h2>
        </div>

        {/* 🔹 ARTICLES GRID */}
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-8">
          {filtered.map((article) => (
            <div
              key={article.id}
              className="bg-white rounded-xl shadow-lg border hover:shadow-2xl transition flex flex-col overflow-hidden"
            >
              {/* IMAGE */}
              <div className="h-44 overflow-hidden">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover hover:scale-105 transition"
                />
              </div>

              {/* CONTENT */}
              <div className="p-4 flex flex-col flex-grow">
                <p className="text-xs text-gray-500 mb-1">
                  {article.date} • {article.author}
                </p>

                <h3 className="font-bold text-lg line-clamp-2 mb-2">
                  {article.title}
                </h3>

                <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                  {article.excerpt}
                </p>

                <button
                  onClick={() => setSelectedArticle(article)}
                  className="mt-auto text-purple-600 font-semibold hover:underline"
                >
                  READ MORE →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 🔹 EMPTY STATE */}
        {filtered.length === 0 && (
          <div className="text-center py-20">
            <h3 className="text-xl font-bold text-gray-700">
              No articles found
            </h3>
          </div>
        )}
      </div>

      {/* 🔹 FULL ARTICLE MODAL */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-black/70 flex justify-center items-start p-4 overflow-y-auto">
          <div className="bg-white max-w-4xl w-full rounded-xl overflow-hidden my-10">

            {/* HEADER */}
            <div className="flex justify-between items-center p-4 border-b">
              <div>
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {selectedArticle.category}
                </span>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="text-2xl"
              >
                ✕
              </button>
            </div>

            {/* IMAGE */}
            <img
              src={selectedArticle.image}
              alt={selectedArticle.title}
              className="w-full h-80 object-cover"
            />

            {/* CONTENT */}
            <div className="p-6">
              <h1 className="text-3xl font-bold mb-4">
                {selectedArticle.title}
              </h1>
              <p className="text-gray-700 leading-relaxed">
                {selectedArticle.content}
              </p>

              <button
                onClick={() => setSelectedArticle(null)}
                className="mt-8 bg-purple-600 text-white px-5 py-2 rounded hover:bg-purple-700"
              >
                ← Back to News
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default NewsToday
