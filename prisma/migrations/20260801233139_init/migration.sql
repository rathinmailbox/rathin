-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL DEFAULT '',
    "coverImage" TEXT,
    "author" TEXT NOT NULL DEFAULT 'Rathin',
    "category" TEXT NOT NULL DEFAULT 'General',
    "tags" TEXT NOT NULL DEFAULT '',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "siteName" TEXT NOT NULL DEFAULT 'rathin.',
    "tagline" TEXT NOT NULL DEFAULT 'A blog on critical thought and populist politics.',
    "about" TEXT NOT NULL DEFAULT '# About\n\nWelcome to my blog. I write here bimonthly, of which my chosen definition of bimonthly varies by my whim. Contained here are my inchoate thoughts on heterodox economics, legal theory, sociology, and technology (sometimes all at once). I hope you find the content edifying and the prose bearable.',
    "accent" TEXT NOT NULL DEFAULT '#c1272d',
    "adColor" TEXT NOT NULL DEFAULT '#ff0000',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Advertisement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "link" TEXT,
    "bgColor" TEXT NOT NULL DEFAULT '#ff0000',
    "textColor" TEXT NOT NULL DEFAULT '#ffffff',
    "speed" INTEGER NOT NULL DEFAULT 20,
    "placement" TEXT NOT NULL DEFAULT 'home',
    "postId" TEXT,
    "paragraphNum" INTEGER,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Advertisement_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");

-- CreateIndex
CREATE INDEX "Post_published_idx" ON "Post"("published");

-- CreateIndex
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");

-- CreateIndex
CREATE INDEX "Advertisement_enabled_placement_order_idx" ON "Advertisement"("enabled", "placement", "order");

-- CreateIndex
CREATE INDEX "Advertisement_postId_idx" ON "Advertisement"("postId");
