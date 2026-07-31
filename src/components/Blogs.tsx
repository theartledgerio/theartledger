/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, User, Clock, ArrowRight } from 'lucide-react';
import { Blog } from '../types';
import { supabase } from '../supabase';

interface BlogsProps {
  searchQuery: string;
  isHome?: boolean;
  onChangePage?: (pageId: string) => void;
  onSelectBlog?: (blog: Blog) => void;
}

const FATHER_DAUGHTER_BLOG_HTML = `<p class="lead text-lg font-serif italic mb-6">A little over a year ago, the New York City art dealer Robert Rogal received a visit to his private showroom from a young woman, who seemed eager to offload a family heirloom.</p>

<div class="my-8 rounded-[24px] overflow-hidden border border-offwhite/50 shadow-md">
  <img src="/blog1/1.png" alt="Raimonds Staprans - Triple Boats" class="w-full h-auto object-cover max-h-[550px]" />
  <p class="text-[10px] font-mono text-graycustom px-6 py-3 bg-offwhite/30 border-t border-offwhite/30 uppercase tracking-wider">Imaged by Heritage Auctions, HA.com</p>
</div>

<p class="mb-4">Introducing herself as Karolina Bankowska, she carried a framed painting signed by Andrew Wyeth, resembling the watercolor landscapes the celebrated artist had completed early in his career. Intrigued, Rogal accepted the piece on consignment, figuring it might fetch between $20,000 to $30,000 at auction.</p>

<blockquote class="border-l-4 border-turquoise pl-4 italic my-6 text-slate-700">"The provenance was a little fuzzy," he said. "But she seemed credible. It wasn't an obvious counterfeit."</blockquote>

<p class="mb-4">In fact, Rogal now believes the painting was a fake — one of at least 200 carefully designed imitations that federal prosecutors say Bankowska, 26, and her father Erwin Bankowski, 50, tried to pass off to unwitting buyers.</p>

<p class="mb-4">As this story goes forward, for the readers it is very important to know what actually provenance is and how does art market verifies if a painting is real or not; <span class="text-turquoise font-medium">[NPR]</span></p>

<h2 class="text-2xl font-serif font-bold text-midnight mt-10 mb-4">The Art market and provenance through the most expensive modern painting ever sold in the auction:</h2>

<div class="my-8 rounded-[24px] overflow-hidden border border-offwhite/50 shadow-md">
  <img src="/blog1/2.png" alt="Portrait of Elisabeth Lederer by Gustav Klimt" class="w-full h-auto object-cover max-h-[650px]" />
  <p class="text-[10px] font-mono text-graycustom px-6 py-3 bg-offwhite/30 border-t border-offwhite/30 uppercase tracking-wider">Gustav Klimt, Portrait of Elisabeth Lederer (1914–1916). Standing over six feet tall, the canvas showcases Klimt's late, ornamental style.</p>
</div>

<p class="mb-4">This is <strong>Portrait of Elisabeth Lederer</strong>; Standing over six-foot tall, the canvas depicts Elisabeth Lederer, daughter of Klimt’s most important patrons, August and Szerena Lederer. Painted between 1914 and 1916, it represents the artist’s late, ornamental style.</p>

<p class="mb-4">Elisabeth is swaddled in a billowing, diaphanous dress, nestled within a textured and ornamental pyramid, an implied Imperial dragon robe. The upper half of her torso is ensconced in an arc of stylised Chinese figures. The effect reminds me of a halo in an icon (religious images painted on wooden panels).</p>

<div class="my-8 rounded-[24px] overflow-hidden border border-offwhite/50 shadow-md">
  <img src="/blog1/3.png" alt="Elisabeth's mother Szerena in her apartment in Vienna with the portrait" class="w-full h-auto object-cover max-h-[500px]" />
  <p class="text-[10px] font-mono text-graycustom px-6 py-3 bg-offwhite/30 border-t border-offwhite/30 uppercase tracking-wider">Elisabeth’s mother Szerena in her apartment in Vienna with the portrait. Wiki Commons</p>
</div>

<p class="mb-4">The setting is fantastical, abstracted, unreal, ornamental – above all, rich. Despite the jewel-like setting, Elisabeth’s face is painted with a striking, psychological realism. Her expression is detached, enigmatic, perhaps isolated. Her hands seem fretful.</p>

<p class="mb-4">It is hard not to project meaning with the benefit of hindsight, but she seems to gaze out from a world of immense Viennese wealth, a world unknowingly on the brink of annihilation.</p>

<p class="mb-4">The Lederers were a prominent Jewish family. After the 1938 Anschluss (the annexation of Austria by Nazi Germany), they faced persecution. The family scattered. But Elisabeth remained, divorced and isolated, in Vienna.</p>

<p class="mb-4">Classified as a <em>Volljüdin</em> (“full Jew”) under the Nazi regime’s antisemitic rule, she faced a likely death. In desperation, she circulated a rumour that she was the illegitimate child of Klimt, the Austrian and Aryan painter of her earlier portrait.</p>

<p class="mb-4">To aid this endeavour, her mother Szerena, who had fled to Budapest, swore an affidavit that Elisabeth’s biological father was not her Jewish husband, August, but Klimt, a notorious philanderer. The claim was not without plausibility. Klimt had a long personal relationship with the Lederer household. Elisabeth’s portrait is itself a document of this interest and closeness.</p>

<p class="mb-4">The Nazis, eager to reclaim Klimt’s genius for the Reich, accepted the fabrication. If Elisabeth was not a “full Jew” but instead a <em>Mischling</em> (half-Jewish), then the painting itself could be reclassified as an Aryan work of art. With Elisabeth’s desperate sleight of hand, both she and the painting were saved.</p>

<p class="mb-4">Aided by her former brother-in-law, a high-ranking Nazi official, Elisabeth was legally reclassified as illegitimate and “half-Aryan”. This lie successfully shielded her from the death camps, uniting art history, gossip and survival in a single legal document.</p>

<div class="my-8 rounded-[24px] overflow-hidden border border-offwhite/50 shadow-md">
  <img src="/blog1/4.png" alt="Klimt in 1914" class="w-full h-auto object-cover max-h-[500px]" />
  <p class="text-[10px] font-mono text-graycustom px-6 py-3 bg-offwhite/30 border-t border-offwhite/30 uppercase tracking-wider">Klimt in 1914, the same year he began the portrait of Elisabeth. Wiki Commons</p>
</div>

<p class="mb-4">This deception also ensured the painting’s physical survival. The Lederer Klimts fell into two camps. The Jewish portraits were degenerate art, and were set aside to be sold. But the rest were considered important heritage. While the Nazis moved the bulk of the looted Lederer collection to the castle Schloss Immendorf for safekeeping, Elisabeth’s portrait remained in Vienna due to its newly contested “Aryan” status, in limbo. In May 1945, SS troops set fire to the Schloss, incinerating over a dozen Klimt masterpieces, including a painting of Elisabeth’s grandmother. But in Vienna, the painting of Elisabeth, and another of her mother, Szerena, survived. This brutal and arbitrary destruction is what makes Elisabeth’s painting such a statistical anomaly. <span class="text-turquoise font-medium">[The Conversation]</span></p>

<p class="mb-4">So the history and the context was much more important than the way we see the objectivity of the beauty in a painting, beauty is not something that has the objective characteristics, but rather subjective form, the way we look at it is the same way we want to look at this world but this world is not still, it’s moving: the nazi’s are gone, the holocaust became the history but what has stayed with us is the memory of these events, the memory of how humans behave and function in different environments, what helps us to remind that we are humans are these stills from these events,</p>

<p class="mb-4">That we call history and that is what we call painting. Which can sustain the way a man looks at this world and it becomes a painting, it reminds us that the history is not lost but is still alive not in the form that it was before.</p>

<p class="mb-4">In 1914–1916 it was sold at a Sotheby's evening auction in New York on November 18, 2025. It fetched an astonishing <strong>$236.4 million</strong> (including buyer's premium), making it the most expensive modern artwork ever auctioned.</p>

<p class="mb-4">Outrunning the other painting by klimt “ Lady with a fan”, which got sold for ($108 million) which is the result of both its astonishing past and the single owner provenance.</p>

<p class="mb-4">The painting was restituted to Elisabeth’s brother Erich in 1948. In 1985, it was purchased by the cosmetics billionaire Leonard A. Lauder.</p>

<p class="mb-4">Unlike many investment-grade masterpieces that are sequestered in free ports, unseen and treated as financial assets, Lauder lived intimately with the work for 40 years, reportedly eating lunch beside it daily.</p>

<p class="mb-4">He frequently loaned it anonymously to major institutions, ensuring its visibility to art history and scholarship, but without testing its value on the market for four decades. Lauder’s loving stewardship added a premium, presenting the work not just as a commodity, but as a cherished, well-documented piece of cultural heritage.</p>

<p class="mb-4">Ultimately, the US$236.4 million price tag reflects a value proposition that transcends simple supply and demand. The anonymous buyer has acquired an object of extreme aesthetic power, but also a tangible relic of resilience. It is a painting saved by a daughter’s lie, a mother’s perjury, the vanity and cupidity of an odious regime, emerging intact from the wreckage of the second world war.</p>

<blockquote class="border-l-4 border-turquoise pl-4 italic my-6 text-slate-700">Every painting has two layers.<br/>The first is the paint.<br/>The second is the story.<br/>In the art market, the story is often worth more than the paint.</blockquote>

<h2 class="text-2xl font-serif font-bold text-midnight mt-10 mb-4">How Provenance Decides Price in Art Markets</h2>

<p class="mb-4">This takes us to the next point: how history (provenance) decides on what price a painting gets sold on; In art markets to preserve the authenticity and integrity of the market from volatility and forgery the documented, unbroken chain of ownership history is analyzed to trace the legitimacy of an art work through its history.</p>

<div class="space-y-6 my-6">
  <div class="bg-offwhite/50 p-6 rounded-2xl border border-offwhite">
    <h3 class="font-serif font-bold text-midnight text-lg mb-2">1. Physical Forensic Evidence (The Object)</h3>
    <p class="text-sm text-graycustom mb-3">An artwork's history is often written on its back. Experts physically examine the piece to match it against historical records: [1]</p>
    <ul class="list-disc pl-5 text-xs md:text-sm space-y-2 text-slate-700">
      <li><strong>Dealer and Gallery Labels:</strong> Paper stickers from historic galleries that track the artwork’s movement through commerce.</li>
      <li><strong>Auction Stencils:</strong> Permanent ink stencils or wax seals applied by houses like Christie's or Sotheby's during past sales.</li>
      <li><strong>Institutional Stamps:</strong> Museum accession numbers or customs stamps that prove legal border crossings.</li>
    </ul>
  </div>

  <div class="bg-offwhite/50 p-6 rounded-2xl border border-offwhite">
    <h3 class="font-serif font-bold text-midnight text-lg mb-2">2. Documentary and Archival Evidence (The Paper Trail)</h3>
    <p class="text-sm text-graycustom mb-3">This involves verifying the "chain of title" through official, written history: [1]</p>
    <ul class="list-disc pl-5 text-xs md:text-sm space-y-2 text-slate-700">
      <li><strong>The Catalogue Raisonné:</strong> The definitive, scholarly inventory of an artist's complete lifetime work. If a piece is missing from this book, it is a major red flag for publishers. [1, 2, 3]</li>
      <li><strong>Historical Bills of Sale:</strong> Original gallery invoices, bank receipts, or estate inventory lists from wills and probates. [1, 2, 3]</li>
      <li><strong>Dealer Archives:</strong> Internal ledger books from historic art dealers (many of which are now digitized by institutions like the Getty Research Institute).</li>
    </ul>
  </div>

  <div class="bg-offwhite/50 p-6 rounded-2xl border border-offwhite">
    <h3 class="font-serif font-bold text-midnight text-lg mb-2">3. Digital and Restitution Databases (The Global Clearance)</h3>
    <p class="text-sm text-graycustom mb-3">Modern provenance checking requires vetting the artwork against international crime and loss registries: [1]</p>
    <ul class="list-disc pl-5 text-xs md:text-sm space-y-2 text-slate-700">
      <li><strong>The Art Loss Register (ALR):</strong> The world's largest private database of stolen, missing, and looted art.</li>
      <li><strong>Interpol & Nazi-Era Registries:</strong> Specialized databases (like Germany's Lost Art Foundation) used to ensure the piece was not illegally seized during World War II or excavated illicitly from archaeological sites. [1, 2, 3, 4]</li>
    </ul>
  </div>
</div>

<h2 class="text-2xl font-serif font-bold text-midnight mt-10 mb-4">Now, let’s trace back to how this Father-Daughter Duo fooled everyone:</h2>

<p class="mb-4">The paintings were forged in Poland by an unnamed co-conspirator — reproductions of lesser-known works by Warhol, Picasso, Banksy, Richard Mayhew, and Fritz Scholder, chosen specifically because lesser-known works are harder to cross-reference.</p>

<p class="mb-4">But the paintings were almost beside the point. What they primarily forged was the ownership history. They made false claims that works had been held in private collections of the artists' associates, or owned by defunct galleries and shuttered businesses — chosen deliberately to make provenance impossible to verify. <span class="text-turquoise font-medium">Brooklyn Eagle</span></p>

<p class="mb-4">To make the paper trail convincing, they extracted sheets of aged paper from antique books, imprinted custom-made stamps mimicking certificates of authenticity onto the paper, and then affixed these to the fake paintings. <span class="text-turquoise font-medium">Brooklyn Eagle</span></p>

<p class="mb-4">They also forged gallery stamps using antique paper, adopting the names of since-shuttered galleries where a given artist might have plausibly shown their work. <span class="text-turquoise font-medium">NPR</span></p>

<p class="mb-4">The trap Rogal nearly fell into was the same trap the whole system sets — he ultimately never listed the Wyeth, in part because the stamp on the back was "too clean." When he called Bankowska and told her to pick it up, she never responded.</p>

<h3 class="text-xl font-serif font-bold italic text-midnight mt-6 mb-3">None of their buyers thought of cross checking the art piece?</h3>

<p class="mb-4">NO, And the reporting tells you exactly why — it wasn't laziness, it was by design.</p>

<p class="mb-4">The Bankowskis deliberately chose galleries and corporations that were no longer operating to make it difficult for buyers to verify the provenance of the counterfeit works. You cannot cross-reference a gallery that doesn't exist anymore. The dead ends were intentional. <span class="text-turquoise font-medium">en</span></p>

<p class="mb-4">They specifically targeted lesser-known pieces to avoid immediate suspicion. A fake of Warhol's most famous works would get scrutinized. A fake of an obscure mid-career piece from a shuttered gallery's inventory? Much easier to slip through. <span class="text-turquoise font-medium">AOL</span></p>

<p class="mb-4">The auction houses that did accept the works — Bonhams, Phillips, Freeman's, and Antique Arena — either declined or did not respond to inquiries about how the fakes passed their review process. DuMouchelles, which paid $160,000 for a fake, said only that they had cooperated with federal authorities. <span class="text-turquoise font-medium">NPR</span></p>

<p class="mb-4">And then there's how it finally unravelled — scrutiny began to mount in March 2023 when representatives for artist Raimonds Staprans discovered a forged painting, "Triple Boats," for sale. It wasn't a buyer who caught them. It was an artist's estate noticing their own work being misrepresented. <span class="text-turquoise font-medium">AOL</span></p>

<h2 class="text-2xl font-serif font-bold text-midnight mt-10 mb-4">Now this is where the sociological Idea of art comes in:</h2>

<blockquote class="border-l-4 border-turquoise pl-4 italic my-6 text-slate-700 text-lg">"Reality no longer has the time to take on the appearance of reality. It no longer even surpasses fiction: it captures every dream even before it takes on the appearance of a dream."<br/><span class="font-bold non-italic text-sm text-midnight mt-2 block">— Jean Baudrillard</span></blockquote>

<p class="mb-4">This is the reality of the modern world that we all see the same reflection no matter how subjective the Art is meant to be,</p>

<p class="mb-4">The real motive of this idea is that the magic doesn’t reside in the art but the way one looks at it, that describes or reflects either the culture or Individual.</p>

<div class="my-8 rounded-[24px] overflow-hidden border border-offwhite/50 shadow-md">
  <img src="/blog1/5.png" alt="Arnold Böcklin - Self-Portrait with Death Playing the Fiddle" class="w-full h-auto object-cover max-h-[550px]" />
  <p class="text-[10px] font-mono text-graycustom px-6 py-3 bg-offwhite/30 border-t border-offwhite/30 uppercase tracking-wider">Arnold Böcklin, Self-Portrait with Death Playing the Fiddle (1872).</p>
</div>

<p class="mb-4">We have become slaves of social acceptance, the stuff that used to feel new, back in time, is now being operated by Algorithms who track our activity and behaviour to give us what we want. Now, this formula or script is what John said is the simulation which runs on a script rather than the reality, and this is what is called simulcara; <strong>The triumph of object over the subject.</strong></p>

<p class="mb-4">How oxymoron of us to see what human kind wants through our past behaviour. If it was so simple we won’t be writing thousands of pages just to describe what we desire. There would be no poetry, stories and art.</p>

<p class="mb-4">Because we would be content with whatever we like, the reality is it’s not what we want but more so how did we get this want, and how did this fulfil function or translate into desire. It’s how we want it to be full filled.</p>

<p class="mb-4">If this man knew what he wanted, there would be no conflict and this world would be in equilibrium. Perhaps we are the most complex animals who do conflict without even knowing what we want.</p>

<p class="mb-4">French philosopher Jean Baudrillard (who died in 2007) is famous for arguing that modern society has become so obsessed with symbols, media, and digital representations that we have lost touch with reality entirely. He called this state <strong>hyperreality</strong>, where a copy feels more real than the original. [1, 2, 3, 4, 5]</p>

<p class="mb-4">In his landmark 1981 book, <em>Simulacra and Simulation</em>, Baudrillard argued that we no longer consume actual objects or experiences. Instead, we consume the meanings and images attached to them by media, advertising, and technology.</p>

<p class="mb-4">A painting didn’t used to represent the imagery but to extend our sensory information regarding it, I have downplayed it a little but i will explain it like this; that a painting should not show you what is already there it has to be that the imagery is not what the function of the painting is, but still there is a painting—I do not see it like this, this thought in itself is an indicator that a painting is real.</p>

<h2 class="text-2xl font-serif font-bold text-midnight mt-10 mb-4">The Triumph of the object:</h2>

<div class="my-8 rounded-[24px] overflow-hidden border border-offwhite/50 shadow-md">
  <img src="/blog1/6.png" alt="Octagonal Renaissance/Devotional Masterpiece" class="w-full h-auto object-cover max-h-[550px]" />
  <p class="text-[10px] font-mono text-graycustom px-6 py-3 bg-offwhite/30 border-t border-offwhite/30 uppercase tracking-wider">The supremacy of the object: Baudrillard's metaphysical scenario of divine objectification.</p>
</div>

<p class="mb-4">For Baudrillard, the subject, the darling of modern philosophy, is defeated in his metaphysical scenario and the object triumphs, a stunning end to the dialectic of subject and object that had been the framework of modern philosophy. The object is thus the subject's <em>“fatality”</em> and Baudrillard's "fatal strategies" project an obscure call to submit to the strategies and ruses of objects. In "banal strategies," "the subject believes itself to always be more clever than the object, whereas in the other [fatal strategies] the object is always supposed to be more shrewd, more cynical, more brilliant than the subject" (1990: 259-260). Previously, in banal strategies, the subject believed itself to be more masterful and sovereign than the object. A fatal strategy, by contrast, recognizes the supremacy of the object and therefore takes the side of the object and surrenders to its strategies, ruses and rules.[UCIS PAPER]</p>

<p class="mb-4">In The Fatal Strategies and succeeding writings, Baudrillard seems to be taking theory into the realm of metaphysics, but it is a specific type of metaphysics deeply inspired by the pataphysics developed by Alfred Jarry in “What is Pataphysics” as “the science of the realm beyond metaphysics.... It will study the laws which govern exceptions and will explain the universe supplementary to this one; or, less ambitiously, it will describe a universe which one can see -- must see perhaps -- instead of the traditional one....“.</p>

<p class="mb-4">Like the universe in Jarry's play Ubu Roi, The Gestures and Opinions of Doctor Faustroll, and other literary texts, Baudrillard's is a totally absurd universe where objects rule in mysterious ways, and people and events are governed by absurd and ultimately unknowable interconnections and predestination (The French playwright Eugene Ionesco is another good source of entry to this universe). Like Jarry's pataphysics, Baudrillard's universe is ruled by surprise, reversal, hallucination, blasphemy, obscenity, and a desire to shock and outrage.</p>

<p class="mb-4">Thus, in view of the growing supremacy of the object, Baudrillard recommends abandoning the subject and siding with the object. Pataphysics aside, it seems that Baudrillard is trying to end the philosophy of subjectivity that has controlled French thought since Descartes by going over to the other side. Descartes' Malin Genie, his evil genius, was a ruse of the subject that tried to seduce him into accepting what was not clear and distinct, but over which he was ultimately able to prevail. Baudrillard's "evil genius" is the object itself that is much more malign than the merely epistemological deceptions of the subject faced by Descartes and which constitutes a “fatal destiny” that demands the end of the philosophy of subjectivity. Henceforth, For Baudrillard, we live in the era of the reign of the object.[UCIS PAPER]</p>

<p class="mb-4">For Jean’s model the world has gone from the subject centric to the object centric:</p>

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
  <div class="rounded-[24px] overflow-hidden border border-offwhite/50 shadow-md bg-white">
    <img src="/blog1/7.png" alt="Descartes Model: Subject to Object" class="w-full h-auto object-contain max-h-[300px] p-4" />
    <p class="text-[10px] font-mono text-graycustom px-6 py-3 bg-offwhite/30 border-t border-offwhite/30 uppercase tracking-wider text-center">Descartes' Model: Subject &rarr; Object</p>
  </div>
  <div class="rounded-[24px] overflow-hidden border border-offwhite/50 shadow-md bg-white">
    <img src="/blog1/8.png" alt="Baudrillard Model: Object to Subject" class="w-full h-auto object-contain max-h-[300px] p-4" />
    <p class="text-[10px] font-mono text-graycustom px-6 py-3 bg-offwhite/30 border-t border-offwhite/30 uppercase tracking-wider text-center">Baudrillard's Model: Object &rarr; Subject</p>
  </div>
</div>

<p class="mb-4">This makes us dive deep into the world that does not even exist; The world of Art, and that is how we explore a painting through <em>the subjectivity of our own mind.</em></p>

<p class="mb-4">This extension of reality is what art does, and it’s genius because it crosses dimensions and realms between two people and causes the man to look into themselves with the newness that this painting just provided.</p>

<p class="mb-4">Ultimately this observation becomes the nature of one that gets engraved in oneself, but still something remains there and that is the authentic nature of any kind of art work with any kind of form.</p>

<p class="mb-4">This is how society becomes object oriented rather than the subject.</p>

<div class="my-8 rounded-[24px] overflow-hidden border border-offwhite/50 shadow-md">
  <img src="/blog1/9.png" alt="Distorted faces surreal collage" class="w-full h-auto object-cover max-h-[550px]" />
  <p class="text-[10px] font-mono text-graycustom px-6 py-3 bg-offwhite/30 border-t border-offwhite/30 uppercase tracking-wider">Visualizing hyperreality: the distorted reflection of collective identity.</p>
</div>

<h2 class="text-2xl font-serif font-bold text-midnight mt-10 mb-4">Conclusion: Takeaway</h2>

<p class="mb-4">Stand in front of a painting long enough and something happens that no certificate of authenticity can replicate. The label falls away. The auction record becomes irrelevant. What remains is the thing itself — pigment, surface, a human hand that moved across a canvas decades or centuries before you were born.</p>

<p class="mb-4">This is what the Bankowskis could never forge. They could replicate brushwork, age paper, and mimic stamps. They could manufacture an entire history on antique sheets pulled from old books. But they could not manufacture the weight that accumulates in an object through time — the way Elisabeth Lederer's portrait carries within it a daughter's lie, a mother's perjury, the arbitrary mercy of a regime's vanity. That weight is not documented anywhere. It is felt.</p>

<p class="mb-4">Baudrillard was right that we have drifted into a world of signs and simulations, where the story around an object often eclipses the object itself. But the fraud reminds us of the limit of that drift. The simulation only holds so long as no one looks too closely. The stamp on the Wyeth was too clean. An artist's estate noticed their own work was misrepresented. Reality, eventually, reasserts itself — not through institutions, but through attention.</p>

<p class="mb-4">Perhaps that is what a painting ultimately asks of us. No belief in its documentation. Not different from its price. Just enough stillness to feel whether something is alive in it or not. That stillness is not naïve — it is the oldest form of verification there is.</p>`;

export default function Blogs({ searchQuery, isHome = false, onChangePage, onSelectBlog }: BlogsProps) {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBlogs() {
      try {
        const { data, error } = await supabase
          .from('blog_submissions')
          .select('*')
          .eq('status', 'approved')
          .order('published_at', { ascending: false });

        if (error) throw error;

        const filtered = data || [];
        
        const extractFirstImage = (htmlContent: string) => {
          const match = htmlContent.match(/<img[^>]+src="([^">]+)"/);
          return match ? match[1] : null;
        };

        const mapped: Blog[] = filtered.map((item, index) => {
          const isFatherDaughter = item.title?.toLowerCase().includes('father-daughter') || item.title?.toLowerCase().includes('fake history');

          if (isFatherDaughter) {
            return {
              id: item.id,
              title: 'A Father-Daughter Duo Who Sold Fake History Instead of Fake Art',
              excerpt: 'How a notorious forgery case unravels the true power of provenance, Baudrillard’s hyperreality, and the triumph of the object in the art market.',
              content: FATHER_DAUGHTER_BLOG_HTML,
              image: '/blog1/1.png',
              readingTime: '12 min read',
              author: item.name || 'Editorial Board',
              category: 'Art Market & Philosophy',
              date: item.published_at 
                ? new Date(item.published_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })
                : 'Mar 15, 2026',
              featured: false
            };
          }

          const wordCount = item.content ? item.content.split(/\s+/).length : 0;
          const readMin = Math.max(1, Math.ceil(wordCount / 200));
          const firstImage = extractFirstImage(item.content || '');
          
          return {
            id: item.id,
            title: item.title,
            excerpt: item.short_description || '',
            content: item.content || '',
            image: firstImage || item.image_url || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800',
            readingTime: `${readMin} min read`,
            author: item.name || 'Editorial Board',
            category: item.category || 'Contemporary',
            date: item.published_at 
              ? new Date(item.published_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
              : 'Recent',
            featured: index === 0
          };
        });

        const uniqueBlogs = mapped.filter((blog, index, self) =>
          index === self.findIndex(b => b.title.toLowerCase().trim() === blog.title.toLowerCase().trim())
        );

        const sorted = [...uniqueBlogs].sort((a, b) => {
          if (a.title.toLowerCase().includes('prajakta')) return -1;
          if (b.title.toLowerCase().includes('prajakta')) return 1;
          return 0;
        });

        if (sorted.length > 0) {
          sorted.forEach((b, i) => {
            b.featured = (i === 0);
          });
          setBlogs(sorted);
        } else {
          // Fallback to default essays if database table is empty
          setBlogs([
            {
              id: 'prajakta-potnis-essay',
              title: 'In Conversation with Prajakta Potnis',
              excerpt: 'Exploring contemporary sculpture, domestic spaces, and post-colonial motifs.',
              content: '<p>Exploring contemporary sculpture, domestic spaces, and post-colonial motifs.</p>',
              image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=800',
              readingTime: '8 min read',
              author: 'Editorial Board',
              category: 'Contemporary',
              date: 'Recent',
              featured: true
            },
            {
              id: 'father-daughter-duo',
              title: 'A Father-Daughter Duo Who Sold Fake History Instead of Fake Art',
              excerpt: 'How a notorious forgery case unravels the true power of provenance, Baudrillard’s hyperreality, and the triumph of the object in the art market.',
              content: FATHER_DAUGHTER_BLOG_HTML,
              image: '/blog1/1.png',
              readingTime: '12 min read',
              author: 'Editorial Board',
              category: 'Art Market & Philosophy',
              date: 'Mar 15, 2026',
              featured: false
            }
          ]);
        }
      } catch (err) {
        console.error('Error fetching blogs from database:', err);
        setBlogs([
          {
            id: 'prajakta-potnis-essay',
            title: 'In Conversation with Prajakta Potnis',
            excerpt: 'Exploring contemporary sculpture, domestic spaces, and post-colonial motifs.',
            content: '<p>Exploring contemporary sculpture, domestic spaces, and post-colonial motifs.</p>',
            image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=800',
            readingTime: '8 min read',
            author: 'Editorial Board',
            category: 'Contemporary',
            date: 'Recent',
            featured: true
          },
          {
            id: 'father-daughter-duo',
            title: 'A Father-Daughter Duo Who Sold Fake History Instead of Fake Art',
            excerpt: 'How a notorious forgery case unravels the true power of provenance, Baudrillard’s hyperreality, and the triumph of the object in the art market.',
            content: FATHER_DAUGHTER_BLOG_HTML,
            image: '/blog1/1.png',
            readingTime: '12 min read',
            author: 'Editorial Board',
            category: 'Art Market & Philosophy',
            date: 'Mar 15, 2026',
            featured: false
          }
        ]);
      } finally {
        setLoading(false);
      }
    }

    loadBlogs();
  }, []);

  // Filter blogs based on global search query
  const filteredBlogs = blogs.filter(blog => {
    return (
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Separate featured blog from standard blogs
  const featuredBlog = filteredBlogs.find(b => b.featured) || filteredBlogs[0];
  const secondaryBlogs = filteredBlogs.filter(b => b.id !== (featuredBlog?.id || ''));

  return (
    <section
      id="blogs"
      className="py-16 md:py-24 bg-offwhite"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Improved Section Header - Elegant Editorial Design */}
        <div className="border-b border-slate-200/60 pb-8 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-mono tracking-[0.25em] text-turquoise font-bold uppercase block mb-2">
              THE LEDGER DIGEST
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-midnight tracking-tight leading-tight">
              Editorial Journal
            </h2>
          </div>
          <p className="text-xs md:text-sm text-graycustom font-sans max-w-md md:text-right leading-relaxed">
            Critical evaluations, artist dialogues, and market research examining contemporary movements and cultural infrastructure.
          </p>
        </div>

        {isHome ? (
          // HOME LAYOUT: Render ONLY the single latest / featured blog with image on left and text on right
          featuredBlog ? (
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                onClick={() => onSelectBlog?.(featuredBlog)}
                className="group relative rounded-[32px] overflow-hidden bg-warmwhite border-[0.5px] border-[#EAE5D8]/30 hover:border-turquoise/30 shadow-xl hover:shadow-2xl transition-all duration-500 grid grid-cols-1 md:grid-cols-12 items-stretch cursor-pointer"
              >
                {/* Left Column: Photo cover (Image on Left) */}
                <div className="md:col-span-5 overflow-hidden relative min-h-[320px] md:min-h-[460px]">
                  <img
                    src={featuredBlog.image}
                    alt={featuredBlog.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1200ms] ease-out"
                    referrerPolicy="no-referrer"
                  />
                  {/* Subtle paper luster overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-midnight/10 via-transparent to-white/10 pointer-events-none mix-blend-overlay" />
                </div>

                {/* Right Column: Body details (Text on Right) */}
                <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-[10px] font-mono text-turquoise font-bold uppercase">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {featuredBlog.author}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-graycustom font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {featuredBlog.readingTime}
                      </span>
                      <span>•</span>
                      <span className="text-graycustom font-medium">{featuredBlog.date}</span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-serif font-bold text-midnight tracking-tight leading-tight group-hover:text-turquoise transition-colors duration-300">
                      {featuredBlog.title}
                    </h3>

                    <p className="text-xs md:text-sm text-graycustom leading-relaxed font-medium">
                      {featuredBlog.excerpt}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 mt-8 border-t border-offwhite/85 w-full">
                    <button
                      id={`read-featured-blog-btn-${featuredBlog.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBlog?.(featuredBlog);
                      }}
                      className="group flex items-center space-x-2 text-xs font-sans font-bold uppercase tracking-widest text-midnight hover:text-turquoise transition-colors duration-200 cursor-pointer"
                    >
                      <span>Read Full Essay</span>
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      >
                        <ArrowRight className="w-4 h-4 text-turquoise" />
                      </motion.span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onChangePage?.('blogs');
                      }}
                      className="px-6 py-3 rounded-xl bg-midnight hover:bg-turquoise text-white text-[9px] font-sans font-bold uppercase tracking-widest transition-all duration-300 cursor-pointer shadow-md hover:shadow-turquoise/15"
                    >
                      EXPLORE FULL JOURNAL ({blogs.length})
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-graycustom font-sans text-sm">No editorial essays available.</p>
            </div>
          )
        ) : (
          // DEDICATED ARCHIVE PAGE LAYOUT (Single-column stacked horizontal cards matching Home page style)
          filteredBlogs.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-gray-200 rounded-3xl max-w-5xl mx-auto">
              <p className="text-graycustom font-sans text-sm">No editorial articles match your search criteria.</p>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-10">
              {filteredBlogs.map((blog) => (
                <motion.div
                  key={blog.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  onClick={() => onSelectBlog?.(blog)}
                  className="group relative rounded-[32px] overflow-hidden bg-warmwhite border-[0.5px] border-[#EAE5D8]/30 hover:border-turquoise/30 shadow-xl hover:shadow-2xl transition-all duration-500 grid grid-cols-1 md:grid-cols-12 items-stretch cursor-pointer"
                >
                  {/* Left Column: Photo cover (Image on Left) */}
                  <div className="md:col-span-5 overflow-hidden relative min-h-[300px] md:min-h-[380px] bg-slate-100 flex items-center justify-center p-3">
                    <img
                      src={blog.image}
                      alt={blog.title}
                      loading="lazy"
                      className="w-full h-full object-cover rounded-2xl group-hover:scale-103 transition-transform duration-700 ease-out shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                    {/* Subtle paper luster overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-midnight/10 via-transparent to-white/10 pointer-events-none mix-blend-overlay" />
                  </div>

                  {/* Right Column: Body details (Text on Right) */}
                  <div className="md:col-span-7 p-7 md:p-10 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-[10px] font-mono text-turquoise font-bold uppercase">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {blog.author}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-graycustom font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          {blog.readingTime}
                        </span>
                        <span>•</span>
                        <span className="text-graycustom font-medium">{blog.date}</span>
                      </div>

                      <h3 className="text-2xl sm:text-3xl font-serif font-bold text-midnight tracking-tight leading-tight group-hover:text-turquoise transition-colors duration-300">
                        {blog.title}
                      </h3>

                      <p className="text-xs md:text-sm text-graycustom leading-relaxed font-medium line-clamp-3">
                        {blog.excerpt}
                      </p>
                    </div>

                    <div className="pt-6 mt-6 border-t border-offwhite/85 flex items-center justify-between">
                      <button
                        id={`read-blog-btn-${blog.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBlog?.(blog);
                        }}
                        className="group flex items-center space-x-2 text-xs font-sans font-bold uppercase tracking-widest text-midnight hover:text-turquoise transition-colors duration-200 cursor-pointer"
                      >
                        <span>Read Full Essay</span>
                        <motion.span
                          animate={{ x: [0, 4, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        >
                          <ArrowRight className="w-4 h-4 text-turquoise" />
                        </motion.span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )
      )}

      </div>

    </section>
  );
}
