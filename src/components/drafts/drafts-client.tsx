'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  PlusCircle,
  SplitSquareVertical,
  BookOpen,
  Edit3,
  List,
  Sparkles,
  CheckCircle2,
  Clock,
  FileText,
  Sun,
  Moon,
  X,
  AlertCircle,
  Layers,
  Heading2,
  Bold,
  Italic,
  Quote,
  Code2,
  MessageSquareQuote
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { DraftsMarkdown } from './drafts-markdown'

interface DraftsClientProps {
  initialContent: string
  initialUpdatedAt: string
}

type ViewMode = 'reader' | 'split' | 'editor'

export function DraftsClient({
  initialContent,
  initialUpdatedAt,
}: DraftsClientProps) {
  const { theme, setTheme } = useTheme()
  const [content, setContent] = useState(initialContent)
  const [savedContent, setSavedContent] = useState(initialContent)
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt)

  // Auth & Editor State
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)

  // Editor mode & saving
  const [viewMode, setViewMode] = useState<ViewMode>('reader')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [hasLocalStorageDraft, setHasLocalStorageDraft] = useState(false)

  // Navigation & Scroll progress
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isTocOpen, setIsTocOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isDirty = content !== savedContent

  // Check auth on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/drafts/auth')
        const data = await res.json()
        if (data.authenticated) {
          setIsAuthenticated(true)
        }
      } catch (err) {
        console.error('Failed to verify session:', err)
      } finally {
        setIsAuthLoading(false)
      }
    }
    checkAuth()
  }, [])

  // Check local storage for recovered drafts
  useEffect(() => {
    try {
      const localDraft = localStorage.getItem('rathin_drafts_scratchpad')
      if (localDraft && localDraft !== initialContent) {
        setHasLocalStorageDraft(true)
      }
    } catch {
      // ignore
    }
  }, [initialContent])

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100
        setScrollProgress(Math.min(100, Math.max(0, currentProgress)))
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Keyboard shortcut: Cmd/Ctrl + S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (isAuthenticated && isDirty) {
          handleSave()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAuthenticated, isDirty, content])

  // Word count and reading stats calculation
  const stats = useMemo(() => {
    const words = content
      .replace(/#|\*|_|-|`|>|\[\[.*?\]\]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length
    const readingTime = Math.max(1, Math.ceil(words / 200))
    const draftSections = (content.match(/(\n|^)---(\n|$)/g) || []).length + 1
    return { words, readingTime, draftSections }
  }, [content])

  // Table of Contents headings
  const tocHeadings = useMemo(() => {
    const lines = content.split('\n')
    const headings: { title: string; id: string }[] = []
    for (const line of lines) {
      const match = line.match(/^##\s+(.+)$/)
      if (match) {
        const title = match[1].trim()
        const id = title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .trim()
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '')
        headings.push({ title, id })
      }
    }
    return headings
  }, [content])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setIsSubmittingPassword(true)

    try {
      const res = await fetch('/api/drafts/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      })

      const data = await res.json()
      if (res.ok && data.ok) {
        setIsAuthenticated(true)
        setIsPasswordModalOpen(false)
        setPasswordInput('')
        setViewMode('split')
      } else {
        setPasswordError(data.error || 'Incorrect password')
      }
    } catch {
      setPasswordError('Network error verifying password')
    } finally {
      setIsSubmittingPassword(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/drafts/auth', { method: 'DELETE' })
    } catch {
      // ignore
    }
    setIsAuthenticated(false)
    setViewMode('reader')
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError('')
    setSaveSuccess(false)

    try {
      const res = await fetch('/api/drafts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      const data = await res.json()
      if (res.ok && data.ok) {
        setSavedContent(content)
        setUpdatedAt(data.updatedAt)
        setSaveSuccess(true)
        localStorage.removeItem('rathin_drafts_scratchpad')
        setHasLocalStorageDraft(false)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        setSaveError(data.error || 'Failed to save drafts')
      }
    } catch {
      setSaveError('Network error saving drafts')
    } finally {
      setIsSaving(false)
    }
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    try {
      localStorage.setItem('rathin_drafts_scratchpad', newContent)
    } catch {
      // ignore
    }
  }

  const restoreLocalStorageDraft = () => {
    try {
      const localDraft = localStorage.getItem('rathin_drafts_scratchpad')
      if (localDraft) {
        setContent(localDraft)
        setHasLocalStorageDraft(false)
      }
    } catch {
      // ignore
    }
  }

  const discardLocalStorageDraft = () => {
    localStorage.removeItem('rathin_drafts_scratchpad')
    setHasLocalStorageDraft(false)
    setContent(savedContent)
  }

  const insertTextAtCursor = useCallback((before: string, after: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) {
      handleContentChange(content + before + after)
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const current = textarea.value
    const selected = current.substring(start, end)
    const replacement = before + selected + after
    const updated = current.substring(0, start) + replacement + current.substring(end)

    handleContentChange(updated)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selected.length
      )
    }, 10)
  }, [content])

  const formatCurrentDateTime = () => {
    const now = new Date()
    const datePart = now.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    const timePart = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    return `${datePart} at ${timePart}`
  }

  const insertNewDraftSection = () => {
    const timestamp = formatCurrentDateTime()
    const newSectionHeader = `## New Draft Title\n*Date: ${timestamp} • Category: General • Status: Working Draft*\n\nDraft content goes here...\n\n---\n\n`

    let updatedContent = ''
    let selectionStart = 3
    let selectionEnd = 18

    // Check if the document has a top-level # Title and an introductory separator
    const firstSepMatch = content.match(/(\r?\n|^)---(\r?\n|$)/)
    const firstH1Match = content.match(/(\r?\n|^)#\s+/)

    if (
      firstSepMatch &&
      firstSepMatch.index !== undefined &&
      firstH1Match &&
      firstH1Match.index !== undefined &&
      firstH1Match.index < firstSepMatch.index
    ) {
      // Keep the top title & intro intact, and insert this new draft right below the first separator
      const insertIdx = firstSepMatch.index + firstSepMatch[0].length
      const before = content.slice(0, insertIdx)
      const after = content.slice(insertIdx).replace(/^\r?\n+/, '')

      updatedContent = `${before}\n## New Draft Title\n*Date: ${timestamp} • Category: General • Status: Working Draft*\n\nDraft content goes here...\n\n---\n\n${after}`
      selectionStart = insertIdx + 4
      selectionEnd = selectionStart + 15
    } else {
      // Prepend right at the top of the document
      updatedContent = `${newSectionHeader}${content.replace(/^\r?\n+/, '')}`
      selectionStart = 3
      selectionEnd = 18
    }

    handleContentChange(updatedContent)

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.scrollTop = 0
        textareaRef.current.setSelectionRange(selectionStart, selectionEnd)
      }
    }, 50)
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0c0c0d] text-neutral-900 dark:text-neutral-100 font-sans selection:bg-amber-200 dark:selection:bg-amber-900/50">
      {/* Scroll Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 right-0 h-1 z-50 bg-transparent"
        aria-hidden="true"
      >
        <div
          className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Top Navigation & Status Bar */}
      <header className="sticky top-0 z-40 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-[#fafaf9]/90 dark:bg-[#0c0c0d]/90 backdrop-blur-md transition-colors">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Home link and drafts branding */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="group flex items-center gap-1.5 text-xs font-mono font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
              title="Return to rathin.blog home"
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>rathin.blog</span>
            </Link>

            <span className="text-neutral-300 dark:text-neutral-700">/</span>

            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-lg tracking-tight text-neutral-900 dark:text-neutral-100">
                drafts
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.68rem] font-mono font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Working Stream
              </span>
            </div>
          </div>

          {/* Middle: Reading stats (hidden on mobile) */}
          <div className="hidden md:flex items-center gap-4 text-xs font-mono text-neutral-500 dark:text-neutral-400">
            <span className="flex items-center gap-1.5" title="Total word count across all drafts">
              <FileText className="h-3.5 w-3.5 text-neutral-400" />
              {stats.words.toLocaleString()} words
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5" title="Estimated reading time">
              <Clock className="h-3.5 w-3.5 text-neutral-400" />
              ~{stats.readingTime} min read
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5" title="Number of draft entries">
              <Layers className="h-3.5 w-3.5 text-neutral-400" />
              {stats.draftSections} entries
            </span>
          </div>

          {/* Right: Tools, TOC, Theme toggle, and Auth Edit button */}
          <div className="flex items-center gap-2">
            {/* Table of Contents Dropdown Trigger */}
            {tocHeadings.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsTocOpen(!isTocOpen)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
                    isTocOpen
                      ? 'bg-neutral-200 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100'
                      : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 text-neutral-600 dark:text-neutral-300'
                  }`}
                  title="Table of Contents"
                >
                  <List className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Index</span>
                </button>

                {/* Dropdown Menu */}
                {isTocOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-neutral-100 dark:border-neutral-800 mb-1 text-[0.7rem] font-mono uppercase tracking-wider text-neutral-400">
                      <span>Jump to Draft</span>
                      <button
                        onClick={() => setIsTocOpen(false)}
                        className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="max-h-72 overflow-y-auto py-1 space-y-0.5">
                      {tocHeadings.map((h, i) => (
                        <a
                          key={h.id + i}
                          href={`#${h.id}`}
                          onClick={() => setIsTocOpen(false)}
                          className="block px-3 py-2 text-xs font-serif rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 line-clamp-1 transition-colors"
                        >
                          {h.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 transition-colors"
              title="Toggle theme"
            >
              <Sun className="h-4 w-4 hidden dark:block" />
              <Moon className="h-4 w-4 block dark:hidden" />
            </button>

            {/* Edit / Unlock Button */}
            {isAuthLoading ? null : isAuthenticated ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  title="Lock editor and sign out"
                >
                  <Unlock className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Lock</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-neutral-900 dark:bg-neutral-100 text-neutral-50 dark:text-neutral-900 hover:opacity-90 transition-opacity shadow-xs"
                title="Author unlock to edit drafts"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
            )}
          </div>
        </div>

        {/* Authenticated Author Toolbar */}
        {isAuthenticated && (
          <div className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/70 px-4 sm:px-6 py-2">
            <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              {/* Left: View Mode Switches */}
              <div className="flex items-center gap-1 bg-white dark:bg-neutral-800/80 p-1 rounded-lg border border-neutral-200 dark:border-neutral-700/60 shadow-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('reader')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                    viewMode === 'reader'
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                  title="Reader View (Preview only)"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Reader</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('split')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                    viewMode === 'split'
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                  title="Side-by-side Split View"
                >
                  <SplitSquareVertical className="h-3.5 w-3.5" />
                  <span>Split View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('editor')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                    viewMode === 'editor'
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                  title="Focused Raw Markdown Editor"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Editor Only</span>
                </button>
              </div>

              {/* Middle: Markdown Quick Tools */}
              {viewMode !== 'reader' && (
                <div className="hidden lg:flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor('## ')}
                    className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                    title="Insert Heading 2"
                  >
                    <Heading2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor('**', '**')}
                    className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                    title="Bold"
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor('*', '*')}
                    className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                    title="Italic"
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor('> ')}
                    className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                    title="Blockquote"
                  >
                    <Quote className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor('`', '`')}
                    className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                    title="Inline Code"
                  >
                    <Code2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor('[[', ']]')}
                    className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-mono text-[0.7rem]"
                    title="Insert Tufte Sidenote [[note]]"
                  >
                    <MessageSquareQuote className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-neutral-300 dark:text-neutral-700 mx-1">|</span>
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor('\n\n---\n\n')}
                    className="flex items-center gap-1 px-2 py-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                    title="Insert Separator"
                  >
                    <span>---</span>
                  </button>
                  <button
                    type="button"
                    onClick={insertNewDraftSection}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 font-medium"
                    title="Add new draft section at top with current timestamp"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>New Section (Top)</span>
                  </button>
                </div>
              )}

              {/* Right: Dirty Status, Save, Reset */}
              <div className="flex items-center gap-2 ml-auto">
                {saveSuccess ? (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Saved
                  </span>
                ) : isDirty ? (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                    Unsaved edits
                  </span>
                ) : (
                  <span className="text-neutral-400 dark:text-neutral-500">
                    All saved
                  </span>
                )}

                {isDirty && (
                  <button
                    type="button"
                    onClick={() => setContent(savedContent)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                    title="Revert to last saved version"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span className="hidden sm:inline">Revert</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={!isDirty || isSaving}
                  onClick={handleSave}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-white transition-all shadow-xs ${
                    isDirty
                      ? 'bg-amber-600 hover:bg-amber-500 active:scale-95'
                      : 'bg-neutral-300 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                  }`}
                  title="Save Drafts (Ctrl+S / Cmd+S)"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Recovered Uncommitted LocalStorage Draft Banner */}
      {hasLocalStorageDraft && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 px-4 py-2.5">
          <div className="mx-auto max-w-4xl flex items-center justify-between text-xs font-mono text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span>You have uncommitted drafts stored in your browser from an earlier session.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={restoreLocalStorageDraft}
                className="px-2.5 py-1 rounded bg-amber-600 text-white font-medium hover:bg-amber-500"
              >
                Restore
              </button>
              <button
                type="button"
                onClick={discardLocalStorageDraft}
                className="px-2.5 py-1 rounded border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {saveError && (
        <div className="bg-red-50 dark:bg-red-950/50 border-b border-red-200 dark:border-red-800 px-4 py-2 text-xs font-mono text-red-600 dark:text-red-400 flex items-center justify-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        {viewMode === 'reader' && (
          <div className="mx-auto max-w-3xl">
            {/* Header intro / metadata */}
            <div className="mb-12 pb-6 border-b border-neutral-200/80 dark:border-neutral-800/80 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-amber-600 dark:text-amber-400 font-semibold mb-1">
                  Unpublished Codex
                </p>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                  rathin / drafts
                </h1>
              </div>
              <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                Last updated {new Date(updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>

            {/* Continuous stream of markdown */}
            <DraftsMarkdown content={content} />

            {/* Footer stamp */}
            <div className="mt-24 pt-8 border-t border-neutral-200/70 dark:border-neutral-800/70 text-center font-mono text-xs text-neutral-400 dark:text-neutral-600">
              End of Working Drafts Stream • {stats.draftSections} entries
            </div>
          </div>
        )}

        {viewMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Pane: Markdown Source Editor */}
            <div className="flex flex-col h-[calc(100vh-12rem)] sticky top-28 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/90 text-xs font-mono text-neutral-500">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                  Markdown Source
                </span>
                <span className="text-[0.7rem] text-neutral-400">
                  Ctrl+S to save
                </span>
              </div>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Write markdown here... Use --- to create a divider between draft entries."
                className="flex-1 w-full p-4 font-mono text-[0.88rem] leading-relaxed bg-transparent text-neutral-900 dark:text-neutral-100 focus:outline-none resize-none overflow-y-auto selection:bg-amber-200 dark:selection:bg-amber-900/50"
                spellCheck="false"
              />
            </div>

            {/* Right Pane: Live Formatted Preview */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-8 shadow-sm">
              <div className="text-xs font-mono uppercase tracking-widest text-amber-600 dark:text-amber-400 font-semibold mb-6 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                Live Reader Preview
              </div>
              <DraftsMarkdown content={content} />
            </div>
          </div>
        )}

        {viewMode === 'editor' && (
          <div className="mx-auto max-w-4xl">
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs font-mono text-neutral-500">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                  Drafts Editor (Full Width)
                </span>
                <button
                  type="button"
                  onClick={insertNewDraftSection}
                  className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium hover:underline"
                  title="Add new draft section at top with current timestamp"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Insert Draft at Top</span>
                </button>
              </div>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                rows={30}
                placeholder="Write markdown here..."
                className="w-full p-6 font-mono text-[0.92rem] leading-relaxed bg-transparent text-neutral-900 dark:text-neutral-100 focus:outline-none resize-y min-h-[500px]"
                spellCheck="false"
              />
            </div>
          </div>
        )}
      </main>

      {/* Password Unlock Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => {
                setIsPasswordModalOpen(false)
                setPasswordError('')
              }}
              className="absolute top-4 right-4 p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-neutral-900 dark:text-neutral-100">
                  Author Access
                </h3>
                <p className="text-xs text-neutral-500 font-mono">
                  Unlock the in-page drafts editor
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
              Enter the drafts authorization password to edit and publish updates to the live drafts stream.
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-neutral-700 dark:text-neutral-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter drafts password"
                    autoFocus
                    required
                    className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 px-4 py-2.5 text-sm font-mono text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {passwordError && (
                <div className="text-xs font-mono text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPassword}
                  className="px-5 py-2 rounded-xl text-xs font-mono font-medium bg-amber-600 hover:bg-amber-500 text-white transition-colors disabled:opacity-50"
                >
                  {isSubmittingPassword ? 'Verifying...' : 'Unlock Editor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
