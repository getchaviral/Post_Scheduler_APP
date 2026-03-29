import React, { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'post-scheduler-sample-posts';

const createInitialForm = () => ({
  content: '',
  imageUrl: '',
  scheduledAt: getDefaultDateTime(),
});

function getDefaultDateTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 30);

  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getPostStatus(scheduledAt) {
  return new Date(scheduledAt) <= new Date() ? 'Posted' : 'Scheduled';
}

function sortPosts(postList) {
  return [...postList].sort((firstPost, secondPost) => new Date(firstPost.scheduledAt) - new Date(secondPost.scheduledAt));
}

function normalizePost(post) {
  return {
    ...post,
    status: getPostStatus(post.scheduledAt),
  };
}

function serializePost(post) {
  return {
    id: post.id,
    content: post.content,
    imageUrl: post.imageUrl,
    scheduledAt: post.scheduledAt,
    createdAt: post.createdAt,
  };
}

function createSamplePosts() {
  const now = new Date();

  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + 1);
  futureDate.setHours(10, 30, 0, 0);

  const pastDate = new Date(now);
  pastDate.setDate(pastDate.getDate() - 1);
  pastDate.setHours(16, 0, 0, 0);

  return sortPosts([
    normalizePost({
      id: 'sample-scheduled-post',
      content: 'Launching our spring campaign tomorrow. Stay tuned for the full reveal and early-access link.',
      imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
      scheduledAt: futureDate.toISOString(),
      createdAt: now.toISOString(),
    }),
    normalizePost({
      id: 'sample-posted-post',
      content: 'Our weekly product roundup is live. Catch the newest updates, design tweaks, and roadmap notes.',
      imageUrl: '',
      scheduledAt: pastDate.toISOString(),
      createdAt: now.toISOString(),
    }),
  ]);
}

function StatusBadge({ status }) {
  const badgeClasses =
    status === 'Posted'
      ? 'border-slate-200 bg-slate-100 text-slate-600'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700';

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${badgeClasses}`}
    >
      {status}
    </span>
  );
}

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-panel backdrop-blur-sm transition duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:border-sky-100 hover:shadow-xl">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{hint}</p>
    </div>
  );
}

function PostCard({ post, isAnimated, onEdit, onDelete }) {
  return (
    <article
      className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:border-sky-200 hover:shadow-xl"
      style={isAnimated ? { animation: 'cardEntry 0.45s ease-out both' } : undefined}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
        <div className="absolute inset-x-8 top-0 h-24 rounded-full bg-sky-100/60 blur-3xl" />
      </div>

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Queued Post</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{formatDateTime(post.scheduledAt)}</h3>
        </div>
        <StatusBadge status={post.status} />
      </div>

      <p className="relative mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600 transition-colors duration-300 group-hover:text-slate-700">
        {post.content}
      </p>

      {post.imageUrl ? (
        <div className="relative mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          <img
            src={post.imageUrl}
            alt="Scheduled post preview"
            className="h-48 w-full object-cover transition duration-500 hover:scale-[1.02]"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        </div>
      ) : null}

      <div className="relative mt-5 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => onEdit(post)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition duration-200 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(post.id)}
          className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 transition duration-200 hover:bg-rose-50"
        >
          Delete
        </button>
      </div>
    </article>
  );
}

export default function App() {
  const [form, setForm] = useState(createInitialForm);
  const [posts, setPosts] = useState(() => {
    const savedPosts = localStorage.getItem(STORAGE_KEY);

    if (!savedPosts) {
      return createSamplePosts();
    }

    try {
      return sortPosts(JSON.parse(savedPosts).map(normalizePost));
    } catch (error) {
      return createSamplePosts();
    }
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [editingPostId, setEditingPostId] = useState(null);
  const [animatedPostId, setAnimatedPostId] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts.map((post) => serializePost(normalizePost(post)))));
  }, [posts]);

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage('');
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  useEffect(() => {
    if (!animatedPostId) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setAnimatedPostId(null);
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [animatedPostId]);

  const metrics = useMemo(() => {
    const normalizedPosts = sortPosts(posts.map(normalizePost));
    const scheduledCount = normalizedPosts.filter((post) => post.status === 'Scheduled').length;
    const nextPost = normalizedPosts.find((post) => post.status === 'Scheduled');

    return {
      scheduledCount,
      nextPostLabel: nextPost ? formatDateTime(nextPost.scheduledAt) : 'No future posts scheduled',
    };
  }, [posts]);

  const isButtonDisabled = !form.content.trim() || !form.scheduledAt || isSubmitting;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.content.trim()) {
      nextErrors.content = 'Post content is required.';
    }

    if (!form.scheduledAt) {
      nextErrors.scheduledAt = 'Please choose a date and time.';
    }

    if (form.imageUrl.trim()) {
      try {
        new URL(form.imageUrl);
      } catch (error) {
        nextErrors.imageUrl = 'Image URL must be valid.';
      }
    }

    return nextErrors;
  };

  const resetComposer = () => {
    setForm(createInitialForm());
    setErrors({});
    setEditingPostId(null);
  };

  const handleEdit = (post) => {
    const localDate = new Date(new Date(post.scheduledAt).getTime() - new Date(post.scheduledAt).getTimezoneOffset() * 60000);

    setEditingPostId(post.id);
    setForm({
      content: post.content,
      imageUrl: post.imageUrl,
      scheduledAt: localDate.toISOString().slice(0, 16),
    });
    setErrors({});
    setSuccessMessage('Editing scheduled post');
  };

  const handleDelete = (postId) => {
    setPosts((currentPosts) => currentPosts.filter((post) => post.id !== postId));

    if (editingPostId === postId) {
      resetComposer();
    }

    setSuccessMessage('Post removed from the queue');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validateForm();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    const postPayload = {
      content: form.content.trim(),
      imageUrl: form.imageUrl.trim(),
      scheduledAt: form.scheduledAt,
    };

    if (editingPostId) {
      setPosts((currentPosts) =>
        sortPosts(
          currentPosts.map((post) =>
            post.id === editingPostId
              ? normalizePost({
                  ...post,
                  ...postPayload,
                })
              : normalizePost(post)
          )
        )
      );
      setSuccessMessage('Post updated successfully \u2705');
      setAnimatedPostId(editingPostId);
    } else {
      const newPost = normalizePost({
        id: crypto.randomUUID(),
        ...postPayload,
        createdAt: new Date().toISOString(),
      });

      setPosts((currentPosts) => sortPosts([...currentPosts, newPost]));
      setSuccessMessage('Post scheduled successfully \u2705');
      setAnimatedPostId(newPost.id);
    }

    resetComposer();

    window.setTimeout(() => {
      setIsSubmitting(false);
    }, 250);
  };

  return (
    <main className="min-h-screen text-slate-900">
      <style>{`
        @keyframes cardEntry {
          0% {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4 px-1">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Post Scheduler Demo</p>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/65 shadow-panel backdrop-blur-xl">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="border-b border-slate-200/80 p-6 lg:border-b-0 lg:border-r lg:p-8">
              <div className="max-w-xl">
                <p className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">
                  Sample Page
                </p>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  Schedule social posts with a clean, client-ready dashboard.
                </h1>
                <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
                  This prototype shows the core workflow: write a post, choose a publish time, and manage your scheduled queue in one polished interface.
                </p>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <StatCard
                  label="Scheduled Posts"
                  value={metrics.scheduledCount}
                  hint="Posts are stored locally so the demo survives refreshes."
                />
                <StatCard
                  label="Next Publish"
                  value={metrics.scheduledCount > 0 ? 'Queued' : 'Waiting'}
                  hint={metrics.nextPostLabel}
                />
              </div>
            </div>

            <div className="p-6 lg:p-8">
              <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-sky-300">Create Post</p>
                    <h2 className="mt-2 text-2xl font-semibold">{editingPostId ? 'Edit scheduled update' : 'Plan the next update'}</h2>
                  </div>
                  <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 sm:block">
                    Single-page demo
                  </div>
                </div>

                <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                  {successMessage ? (
                    <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-200">
                      {successMessage}
                    </div>
                  ) : null}

                  <div>
                    <label htmlFor="content" className="mb-2 block text-sm font-medium text-slate-200">
                      Post content
                    </label>
                    <textarea
                      id="content"
                      name="content"
                      rows="5"
                      value={form.content}
                      onChange={handleChange}
                      placeholder="Share a product update, launch reminder, or campaign teaser..."
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30"
                    />
                    {errors.content ? <p className="mt-2 text-sm text-rose-300">{errors.content}</p> : null}
                  </div>

                  <div>
                    <label htmlFor="imageUrl" className="mb-2 block text-sm font-medium text-slate-200">
                      Image URL
                    </label>
                    <input
                      id="imageUrl"
                      name="imageUrl"
                      type="url"
                      value={form.imageUrl}
                      onChange={handleChange}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30"
                    />
                    {errors.imageUrl ? <p className="mt-2 text-sm text-rose-300">{errors.imageUrl}</p> : null}
                  </div>

                  <div>
                    <label htmlFor="scheduledAt" className="mb-2 block text-sm font-medium text-slate-200">
                      Publish date &amp; time
                    </label>
                    <input
                      id="scheduledAt"
                      name="scheduledAt"
                      type="datetime-local"
                      value={form.scheduledAt}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30"
                    />
                    {errors.scheduledAt ? <p className="mt-2 text-sm text-rose-300">{errors.scheduledAt}</p> : null}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      disabled={isButtonDisabled}
                      className="inline-flex w-full items-center justify-center rounded-2xl bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950 transition duration-200 hover:-translate-y-0.5 hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:bg-sky-400"
                    >
                      {isSubmitting ? 'Saving...' : editingPostId ? 'Update Post' : 'Schedule Post'}
                    </button>

                    {editingPostId ? (
                      <button
                        type="button"
                        onClick={resetComposer}
                        className="inline-flex w-full items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition duration-200 hover:bg-white/10"
                      >
                        Cancel Edit
                      </button>
                    ) : null}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-panel backdrop-blur-md lg:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Scheduled Queue</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Upcoming posts</h2>
            </div>
            <p className="text-sm text-slate-500">Card-based layout with local persistence for quick demos.</p>
          </div>

          {posts.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <p className="text-lg font-medium text-slate-700">No posts scheduled yet</p>
              <p className="mt-2 text-sm text-slate-500">Create your first scheduled post to populate the dashboard.</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {sortPosts(posts.map(normalizePost)).map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isAnimated={animatedPostId === post.id}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}