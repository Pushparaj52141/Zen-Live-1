import React, { useEffect, useState, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'
import { getPageColors } from '@shared/utils/pageColors'
import { FiX, FiEye, FiTrash2, FiSearch, FiFilter, FiStar, FiRefreshCw } from 'react-icons/fi'
import { SiGoogle } from 'react-icons/si'
import { RATING_OPTIONS, SOURCE_OPTIONS } from './constants/reviewFilters'
import { reviewsService } from './services/reviewsService'
import { useReviewPermissions } from './hooks/useReviewPermissions'

export default function ReviewsMain() {
  const location = useLocation()
  const colors = getPageColors(location.pathname)
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingGoogle, setSyncingGoogle] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [reviewStats, setReviewStats] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editReview, setEditReview] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRating, setFilterRating] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { isAdmin } = useReviewPermissions();

  const ratingOptions = RATING_OPTIONS;
  const sourceOptions = SOURCE_OPTIONS;

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const normalized = await reviewsService.fetchAll()
      setReviews(normalized)
    } catch (err) {
      console.error('Failed to fetch reviews:', err)
      if (err.response?.status !== 404) {
        Swal.fire('Error', 'Failed to fetch reviews', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchSyncStatus = async () => {
    try {
      const lastSyncData = await reviewsService.fetchSyncStatus()
      if (lastSyncData) setLastSync(lastSyncData)
    } catch (err) {
      console.error('Failed to fetch sync status:', err)
    }
  }

  const fetchReviewStats = async () => {
    try {
      const stats = await reviewsService.fetchStats()
      if (stats) setReviewStats(stats)
    } catch (err) {
      console.error('Failed to fetch review stats:', err)
    }
  }

  useEffect(() => {
    fetchReviews();
    fetchSyncStatus();
    fetchReviewStats();
  }, []);

  const handleSyncGoogle = async () => {
    if (!isAdmin) {
      Swal.fire('Restricted', 'Only admins can sync Google reviews', 'warning')
      return
    }

    setSyncingGoogle(true)
    try {
      const res = await reviewsService.syncGoogle()
      
      if (res.data.success) {
        Swal.fire({
          title: 'Success!',
          html: `
            <p>${res.data.message || 'Google reviews synced successfully'}</p>
            <p class="text-sm text-gray-600 mt-2">
              Fetched: ${res.data.data.fetched}<br/>
              Saved: ${res.data.data.saved}
            </p>
          `,
          icon: 'success'
        })
        await fetchReviews()
        await fetchSyncStatus()
        await fetchReviewStats()
      } else {
        Swal.fire('Partial Success', res.data.error || 'Some reviews may not have synced', 'warning')
      }
    } catch (err) {
      console.error('Failed to sync Google reviews:', err)
      Swal.fire('Error', err.response?.data?.message || 'Failed to sync Google reviews', 'error')
    } finally {
      setSyncingGoogle(false)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      customer_name: form.customer_name.value,
      course_name: form.course_name.value,
      rating: parseInt(form.rating.value),
      review_text: form.review_text.value,
      review_date: form.review_date.value,
    };
    try {
      await reviewsService.create(data)
      await fetchReviews()
      await fetchReviewStats()
      setAddModalOpen(false)
      Swal.fire('Success', 'Review added successfully!', 'success')
      form.reset()
    } catch (err) {
      console.error('Failed to add review:', err)
      Swal.fire('Error', 'Failed to add review', 'error')
    }
  };

  const openEditModal = async (review) => {
    if (review.source === 'google') {
      Swal.fire({
        title: 'Google Review',
        html: `
          <div class="text-left">
            <p class="mb-2"><strong>Author:</strong> ${review.author_name}</p>
            <p class="mb-2"><strong>Rating:</strong> ${'⭐'.repeat(review.rating)}</p>
            <p class="mb-2"><strong>Review:</strong></p>
            <p class="text-gray-700">${review.review_text || 'No review text'}</p>
            <p class="mt-4 text-sm text-gray-500">
              ${review.relative_time_description || 'Posted'} on Google
            </p>
            <div class="flex items-center gap-2 mt-2 text-xs text-gray-400">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Source: Google Reviews (Read-only)
            </div>
          </div>
        `,
        icon: 'info',
        confirmButtonText: 'Close'
      })
      return
    }

    try {
      const res = await reviewsService.fetchManualById(review.id)
      setEditReview(res.data.review || res.data)
      setEditModalOpen(true)
    } catch (err) {
      console.error('Failed to load review:', err)
      Swal.fire('Error', 'Failed to load review', 'error')
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const id = form.id.value;
    const data = {
      customer_name: form.customer_name.value,
      course_name: form.course_name.value,
      rating: parseInt(form.rating.value),
      review_text: form.review_text.value,
      review_date: form.review_date.value,
    };
    try {
      await reviewsService.update(id, data)
      await fetchReviews()
      await fetchReviewStats()
      setEditModalOpen(false)
      Swal.fire('Success', 'Review updated successfully!', 'success')
    } catch (err) {
      console.error('Failed to update review:', err)
      Swal.fire('Error', 'Failed to update review', 'error')
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "Delete this review?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await reviewsService.remove(id)
          await fetchReviews()
          await fetchReviewStats()
          setEditModalOpen(false)
          Swal.fire('Deleted!', 'Review deleted.', 'success')
        } catch (err) {
          console.error('Failed to delete review:', err)
          Swal.fire("Error", err.response?.data?.message || "Failed to delete review", "error");
        }
      }
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            className={star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
            size={16}
          />
        ))}
      </div>
    );
  };

  const renderSourceBadge = (source) => {
    if (source === 'google') {
      return (
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 border border-blue-200">
          <SiGoogle className="text-blue-600" size={12} />
          <span className="text-xs font-semibold text-blue-700">Google</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 border border-gray-300">
        <span className="text-xs font-semibold text-gray-700">Manual</span>
      </div>
    )
  };

  const fieldStyle = {
    borderColor: `${colors.primary}50`,
  }

  const inputClass =
    "w-full rounded-lg border px-4 py-3 text-[15px] focus:outline-none transition";

  const focusHandlers = {
    onFocus: (e) => {
      e.target.style.borderColor = colors.primary
      e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`
    },
    onBlur: (e) => {
      e.target.style.borderColor = `${colors.primary}50`
      e.target.style.boxShadow = ''
    },
  }

  const pillStyle = {
    backgroundColor: `${colors.primary}12`,
    color: colors.primaryDark,
    borderRadius: '0.65rem',
    padding: '0.35rem 0.75rem',
    fontWeight: 600,
    display: 'inline-block',
    minWidth: '90px',
    textAlign: 'center',
  }

  const filteredReviews = useMemo(() => {
    let filtered = [...reviews];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((review) => {
        const authorName = (review.author_name || review.customer_name || "").toLowerCase();
        const courseName = (review.course_name || "").toLowerCase();
        const reviewText = (review.review_text || "").toLowerCase();
        return (
          authorName.includes(query) ||
          courseName.includes(query) ||
          reviewText.includes(query)
        );
      });
    }

    if (filterRating) {
      filtered = filtered.filter((review) => review.rating === parseInt(filterRating));
    }

    if (filterSource) {
      filtered = filtered.filter((review) => review.source === filterSource);
    }

    return filtered;
  }, [reviews, searchQuery, filterRating, filterSource]);

  return (
    <div className="p-4 md:p-6">
      {reviewStats && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4 shadow-sm" style={{ borderColor: `${colors.primary}30` }}>
            <div className="text-sm text-gray-600">Total Reviews</div>
            <div className="text-2xl font-bold" style={{ color: colors.primary }}>{reviewStats.total_reviews}</div>
          </div>
          <div className="bg-white rounded-lg border p-4 shadow-sm" style={{ borderColor: `${colors.primary}30` }}>
            <div className="text-sm text-gray-600">Average Rating</div>
            <div className="text-2xl font-bold flex items-center gap-2" style={{ color: colors.primary }}>
              {parseFloat(reviewStats.average_rating).toFixed(1)}
              <FiStar className="fill-yellow-400 text-yellow-400" size={20} />
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4 shadow-sm" style={{ borderColor: `${colors.primary}30` }}>
            <div className="text-sm text-gray-600">Manual Reviews</div>
            <div className="text-2xl font-bold" style={{ color: colors.primary }}>{reviewStats.manual_reviews}</div>
          </div>
          <div className="bg-white rounded-lg border p-4 shadow-sm" style={{ borderColor: `${colors.primary}30` }}>
            <div className="text-sm text-gray-600">Google Reviews</div>
            <div className="text-2xl font-bold flex items-center gap-2" style={{ color: colors.primary }}>
              {reviewStats.google_reviews}
              <SiGoogle className="text-blue-600" size={16} />
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-3">
          <button
            className="group flex items-center gap-3 rounded-xl border bg-white shadow-sm hover:shadow-md px-6 py-3 transition-all duration-300 hover:-translate-y-0.5"
            style={{ borderColor: `${colors.primary}40` }}
            onClick={() => setAddModalOpen(true)}
          >
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors group-hover:scale-110"
              style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}
            >
              <span className="text-xl leading-none font-bold">+</span>
            </div>
            <span className="text-sm font-bold tracking-wide" style={{ color: colors.primary }}>
              Add Manual Review
            </span>
          </button>

          {isAdmin && (
            <button
              className="group flex items-center gap-3 rounded-xl border bg-white shadow-sm hover:shadow-md px-6 py-3 transition-all duration-300 hover:-translate-y-0.5"
              style={{ borderColor: '#4285f4' }}
              onClick={handleSyncGoogle}
              disabled={syncingGoogle}
            >
              <FiRefreshCw 
                className={`text-blue-600 ${syncingGoogle ? 'animate-spin' : ''}`} 
                size={20} 
              />
              <span className="text-sm font-bold tracking-wide text-blue-600">
                {syncingGoogle ? 'Syncing...' : 'Sync Google Reviews'}
              </span>
            </button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial md:w-64">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-0 text-sm"
              style={{ borderColor: `${colors.primary}50` }}
              onFocus={(e) => {
                e.target.style.borderColor = colors.primary;
                e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = `${colors.primary}50`;
                e.target.style.boxShadow = '';
              }}
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              showFilters || filterRating || filterSource
                ? 'text-white'
                : 'text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            style={showFilters || filterRating || filterSource ? { 
              backgroundColor: colors.primary,
              borderColor: colors.primary 
            } : {}}
          >
            <FiFilter size={18} />
            Filters
            {(filterRating || filterSource) && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-white/20">
                {(filterRating ? 1 : 0) + (filterSource ? 1 : 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {lastSync && lastSync.status && (
        <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SiGoogle className="text-blue-600" size={16} />
            <span>
              Last sync: <strong>{new Date(lastSync.sync_date).toLocaleString()}</strong> - 
              Fetched: {lastSync.reviews_fetched}, Saved: {lastSync.reviews_saved}
            </span>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${
            lastSync.status === 'success' ? 'bg-green-100 text-green-700' :
            lastSync.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {lastSync.status?.toUpperCase() || 'UNKNOWN'}
          </span>
        </div>
      )}

      {showFilters && (
        <div className="mb-4 p-4 rounded-lg border bg-white shadow-sm" style={{ borderColor: `${colors.primary}30` }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: colors.primaryDark }}>
              Filter Options
            </h3>
            <button
              onClick={() => {
                setFilterRating("");
                setFilterSource("");
                setShowFilters(false);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Filter by Rating
              </label>
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: `${colors.primary}50` }}
                {...focusHandlers}
              >
                <option value="">All Ratings</option>
                {ratingOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Filter by Source
              </label>
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: `${colors.primary}50` }}
                {...focusHandlers}
              >
                <option value="">All Sources</option>
                {sourceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {(searchQuery || filterRating || filterSource) && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredReviews.length} of {reviews.length} reviews
        </div>
      )}

      <div className="overflow-x-auto overflow-y-auto max-h-[70vh] rounded-md border bg-white" style={{ borderColor: `${colors.primary}30` }}>
        <table className="min-w-[1100px] w-full text-center">
          <thead className="sticky top-0 z-10 text-white text-sm" style={{ backgroundColor: colors.primary }}>
            <tr>
              <th className="px-4 py-3 font-semibold text-center">ID</th>
              <th className="px-4 py-3 font-semibold text-center">AUTHOR</th>
              <th className="px-4 py-3 font-semibold text-center">COURSE</th>
              <th className="px-4 py-3 font-semibold text-center">RATING</th>
              <th className="px-4 py-3 font-semibold text-center">REVIEW</th>
              <th className="px-4 py-3 font-semibold text-center">SOURCE</th>
              <th className="px-4 py-3 font-semibold text-center">DATE</th>
              <th className="px-4 py-3 font-semibold text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-6" style={{ color: `${colors.primary}80` }}>
                  Loading...
                </td>
              </tr>
            ) : filteredReviews.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-6" style={{ color: `${colors.primary}80` }}>
                  {reviews.length === 0 ? "No reviews found." : "No reviews match your search/filters"}
                </td>
              </tr>
            ) : (
              filteredReviews.map((review, idx) => {
                const reviewDate = review.review_time || review.review_date;
                const authorName = review.author_name || review.customer_name;
                
                return (
                  <tr
                    key={`${review.source}-${review.id}`}
                    onClick={() => openEditModal(review)}
                    className="cursor-pointer hover:opacity-90"
                    style={{
                      backgroundColor: idx % 2 ? `${colors.primary}04` : 'white',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="w-full rounded-md px-4 py-2 font-semibold" style={pillStyle}>
                        {review.id}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {review.profile_photo_url && (
                          <img 
                            src={review.profile_photo_url} 
                            alt={authorName}
                            className="w-6 h-6 rounded-full"
                          />
                        )}
                        <div className="w-full rounded-md px-4 py-2 font-semibold" style={pillStyle}>
                          {authorName}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="w-full rounded-md px-4 py-2 font-semibold" style={pillStyle}>
                        {review.course_name || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center">
                        {renderStars(review.rating)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center max-w-xs">
                      <div className="truncate" title={review.review_text}>
                        {review.review_text}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {renderSourceBadge(review.source)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="w-full rounded-md px-4 py-2 font-semibold" style={pillStyle}>
                        {reviewDate ? new Date(reviewDate).toLocaleDateString() : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center">
                        <button 
                          title="View Details"
                          onClick={(e) => { e.stopPropagation(); openEditModal(review); }}
                          className="p-2 rounded-full transition-colors hover:opacity-80"
                          style={{ 
                            color: colors.primary, 
                            backgroundColor: `${colors.primary}15`
                          }}
                        >
                          <FiEye size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {addModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <form
            className="bg-white rounded-2xl shadow-lg w-full max-w-2xl border overflow-hidden"
            style={{ borderColor: `${colors.primary}30` }}
            onSubmit={handleAdd}
          >
            <div
              className="px-6 py-4 flex items-center justify-between text-white"
              style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})` }}
            >
              <h3 className="text-xl font-semibold">Add Manual Review</h3>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="text-white/90 hover:text-white text-2xl leading-none"
              >
                <FiX />
              </button>
            </div>
            <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Customer Name</label>
                <input
                  name="customer_name"
                  className={inputClass}
                  placeholder="Enter customer name"
                  required
                  style={fieldStyle}
                  {...focusHandlers}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Course Name</label>
                <input
                  name="course_name"
                  className={inputClass}
                  placeholder="Enter course name"
                  required
                  style={fieldStyle}
                  {...focusHandlers}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Rating</label>
                <select
                  name="rating"
                  className={inputClass}
                  defaultValue={5}
                  required
                  style={fieldStyle}
                  {...focusHandlers}
                >
                  {ratingOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Review Date</label>
                <input
                  name="review_date"
                  type="date"
                  className={inputClass}
                  required
                  style={fieldStyle}
                  {...focusHandlers}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Review Text</label>
                <textarea
                  name="review_text"
                  className={inputClass}
                  placeholder="Enter review text"
                  rows={4}
                  required
                  style={fieldStyle}
                  {...focusHandlers}
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-2 pt-6 border-t mt-4">
                <button
                  type="button"
                  className="px-6 py-2 rounded font-semibold border text-gray-700 hover:bg-gray-50"
                  onClick={() => setAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded font-semibold text-white"
                  style={{ backgroundColor: colors.primary }}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = colors.primaryDark)}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = colors.primary)}
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {editModalOpen && editReview && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <form
            className="bg-white rounded-2xl shadow-lg w-full max-w-2xl border overflow-hidden"
            style={{ borderColor: `${colors.primary}30` }}
            onSubmit={handleEdit}
          >
            <div
              className="px-6 py-4 flex items-center justify-between text-white"
              style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})` }}
            >
              <h3 className="text-xl font-semibold">Edit Review</h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="text-white/90 hover:text-white text-2xl leading-none"
              >
                <FiX />
              </button>
            </div>
            <input type="hidden" name="id" value={editReview.id} />
            <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Customer Name</label>
                <input
                  name="customer_name"
                  className={inputClass}
                  placeholder="Enter customer name"
                  defaultValue={editReview.customer_name}
                  required
                  style={fieldStyle}
                  {...focusHandlers}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Course Name</label>
                <input
                  name="course_name"
                  className={inputClass}
                  placeholder="Enter course name"
                  defaultValue={editReview.course_name}
                  required
                  style={fieldStyle}
                  {...focusHandlers}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Rating</label>
                <select
                  name="rating"
                  className={inputClass}
                  defaultValue={editReview.rating}
                  required
                  style={fieldStyle}
                  {...focusHandlers}
                >
                  {ratingOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Review Date</label>
                <input
                  name="review_date"
                  type="date"
                  className={inputClass}
                  defaultValue={editReview.review_date ? editReview.review_date.split('T')[0] : ''}
                  required
                  style={fieldStyle}
                  {...focusHandlers}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Review Text</label>
                <textarea
                  name="review_text"
                  className={inputClass}
                  placeholder="Enter review text"
                  rows={4}
                  defaultValue={editReview.review_text}
                  required
                  style={fieldStyle}
                  {...focusHandlers}
                />
              </div>
              <div className="md:col-span-2 flex justify-between items-center pt-6 border-t mt-4">
                <button
                  type="button"
                  title="Delete Review"
                  className="p-2 rounded-full text-red-600 bg-red-100 hover:bg-red-200 transition-colors"
                  onClick={() => handleDelete(editReview.id)}
                >
                  <FiTrash2 size={20} />
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="px-6 py-2 rounded font-semibold border text-gray-700 hover:bg-gray-50"
                    onClick={() => setEditModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded font-semibold text-white"
                    style={{ backgroundColor: colors.primary }}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = colors.primaryDark)}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = colors.primary)}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
