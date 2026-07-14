import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const SAMPLE_POSTS = [
  {
    title: 'Welcome to Your New Publication',
    excerpt:
      'A quick tour of your blog, the admin panel, and how to publish your first story — no code required.',
    category: 'Guides',
    author: 'Editorial Team',
    tags: 'welcome,getting-started,guide',
    featured: true,
    content: `# Welcome to Your New Publication

This is your blog. Everything you're reading right now can be edited from the **Admin Panel** — no code, no command line, no fuss.

## What you can do

- **Write posts** with a rich text editor (headings, bold, lists, links, images).
- **Add a cover image** for each story — paste a URL or generate one with AI.
- **Organize** stories with categories and tags.
- **Publish or unpublish** with a single toggle.
- **Edit your site** name, tagline, accent color, and About page.

## How to publish your first post

1. Open the **Admin** link in the top navigation.
2. Log in with your password (the default is \`admin123\` — change it later).
3. Click **New Post**.
4. Write a title, add some content, and hit **Publish**.

That's it. Your story appears on the homepage instantly.

> Tip: Mark a post as **Featured** to pin it to the top of the homepage.

## Make it yours

This template is intentionally simple. Swap the site name, pick an accent color you love, and start writing. The design stays out of your way so your words can do the talking.

Happy publishing.`,
  },
  {
    title: 'Five Habits of Clearer Writing',
    excerpt:
      'Concrete tips for saying more with less — gathered from editors who have spent decades trimming copy.',
    category: 'Craft',
    author: 'Editorial Team',
    tags: 'writing,craft,tips',
    featured: false,
    content: `# Five Habits of Clearer Writing

Good writing is mostly good cutting. Here are five habits that almost always help.

## 1. Lead with the point

Readers decide in the first sentence whether to keep going. Spend that sentence wisely — tell them what the story is.

## 2. Prefer short sentences

Long sentences aren't smarter. They're just harder to parse. Break them up.

## 3. Cut adverbs

If a verb needs an adverb, you probably picked the wrong verb. *Run fast* becomes *sprint*. *Said loudly* becomes *shouted*.

## 4. Read it aloud

Anything that sounds awkward spoken will read awkwardly too. Your ear catches what your eye misses.

## 5. Sleep on it

The best edit happens the morning after. Distance turns your own prose into something you can actually critique.

> Writing is rewriting. The first draft is just clay.

Keep these in your back pocket and your next piece will be sharper for it.`,
  },
  {
    title: 'How to Find Stories Worth Telling',
    excerpt:
      'Ideas are everywhere once you start looking with intent. A short field guide for curious minds.',
    category: 'Craft',
    author: 'Editorial Team',
    tags: 'ideas,creativity,craft',
    featured: false,
    content: `# How to Find Stories Worth Telling

The hardest part of writing isn't writing — it's noticing what's worth writing about.

## Pay attention to friction

The moment you think "why is this so annoying?" — that's a story. Friction is everywhere, and naming it clearly is a service to readers.

## Ask "and then what?"

A good story has momentum. If your idea can't survive three rounds of "and then what?", it might be a fact, not a story.

## Borrow structures, not content

You can't steal someone's words, but you can borrow a shape. A list, a day-in-the-life, a before-and-after — proven frames make your own material easier to organize.

## Keep a capture habit

Ideas evaporate. A notes app, a pocket notebook, a voice memo — whatever you'll actually use. The medium matters less than the consistency.

> "The writer's job is to see what everyone sees and think what no one has thought." — roughly, Albert Szent-Györgyi

Start a list today. By next week you'll have more material than time.`,
  },
]

async function main() {
  // Seed settings
  await db.siteSetting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      siteName: 'rathin.',
      tagline: 'Independent stories, sharp perspectives.',
      about:
        '# About\n\nWelcome to **rathin.blog** — a small, independent publication for curious readers.\n\nWe publish essays, guides, and the occasional argument. New stories land regularly.\n\nThis page is fully editable from the admin panel. Replace this text with your own story.',
      accent: '#c1272d',
    },
  })

  // Seed posts (only if none exist yet)
  const existing = await db.post.count()
  if (existing > 0) {
    console.log(`Seed: ${existing} posts already exist, skipping post seed.`)
    return
  }

  for (const post of SAMPLE_POSTS) {
    const base = slugify(post.title)
    let slug = base
    let n = 2
    while (await db.post.findFirst({ where: { slug } })) {
      slug = `${base}-${n++}`
    }
    await db.post.create({
      data: {
        title: post.title,
        slug,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category,
        author: post.author,
        tags: post.tags,
        featured: post.featured,
        published: true,
        coverImage: null,
      },
    })
  }
  console.log('Seed: created sample posts and settings.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
