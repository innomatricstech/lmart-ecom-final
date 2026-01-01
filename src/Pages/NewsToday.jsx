import React, { useState, useEffect, useRef } from 'react'
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
  const videoRef = useRef(null)

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
            category: data.category || 'General',
            author: data.author || 'Admin',
            date: formatDate(data.createdAt || data.date),
            image: data.imageUrl ||
              'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=400&fit=crop',
            videoUrl: data.videoUrl || null,
            createdAt: data.createdAt,
            hasVideo: !!data.videoUrl
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

  // 🔹 CLOSE MODAL
  const closeModal = () => {
    setSelectedArticle(null)
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }

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
              <div className="h-44 bg-gray-100 flex items-center justify-center">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* VIDEO PREVIEW (BELOW IMAGE) */}
              {article.hasVideo && (
                <div className="px-4 pt-3 pb-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-700 bg-purple-50 rounded-lg p-2">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg 
                        className="w-4 h-4 text-white ml-0.5" 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                    </div>
                    <span className="font-medium text-purple-700">Video Available</span>
                  </div>
                </div>
              )}

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
                onClick={closeModal}
                className="text-2xl"
              >
                ✕
              </button>
            </div>

            {/* IMAGE */}
            <div className="w-full h-80 bg-gray-100 flex items-center justify-center">
              <img
                src={selectedArticle.image}
                alt={selectedArticle.title}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* VIDEO (BELOW IMAGE IN MODAL) */}
            {selectedArticle.hasVideo && selectedArticle.videoUrl && (
              <div className="px-6 pt-6">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                    <svg 
                      className="w-5 h-5 text-purple-600 mr-2" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                    Video Content
                  </h3>
                </div>
                <div className="rounded-lg overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    src={selectedArticle.videoUrl}
                    controls
                    className="w-full h-auto max-h-[400px]"
                    controlsList="nodownload"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            )}

            {/* CONTENT */}
            <div className="p-6">
              <h1 className="text-3xl font-bold mb-4">
                {selectedArticle.title}
              </h1>
              
              <div className="flex items-center text-gray-500 text-sm mb-6">
                <span>{selectedArticle.date}</span>
                <span className="mx-2">•</span>
                <span>By {selectedArticle.author}</span>
              </div>
              
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {selectedArticle.content}
                </p>
              </div>

              <button
                onClick={closeModal}
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