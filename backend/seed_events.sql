-- Seed script for events table in The Art Ledger
-- Target: Supabase PostgreSQL Database

INSERT INTO public.events (
    id,
    slug,
    title,
    short_description,
    long_description,
    featured_image_url,
    gallery_images,
    video_url,
    event_date,
    location,
    status,
    display_order
) VALUES 
(
    'e1111111-1111-1111-1111-111111111111',
    'the-silent-monument',
    'The Silent Monument',
    'A retrospective of Brutalist concrete casting.',
    'An immersive collection featuring Marcus Thorne''s monumental Concrete monoliths coupled with micro-textured resin castings. Includes a guest talk on brutalist heritage.',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800',
    '{"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800"}',
    NULL,
    '2026-07-20',
    'Metropolitan Art Ledger, Pavilion B',
    'published',
    1
),
(
    'e2222222-2222-2222-2222-222222222222',
    'digital-resonances',
    'Digital Resonances',
    'Interactive environments reacting to global heartbeats.',
    'A generative light event mapping crowd interaction to visual matrices. Attendants will wear biometric sensors that directly alter the rendering code.',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800',
    '{"https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800"}',
    NULL,
    '2026-08-05',
    'TAL Virtual Sphere & Tokyo Dome Space',
    'published',
    2
),
(
    'e3333333-3333-3333-3333-333333333333',
    'beneath-the-canvas',
    'Beneath the Canvas: Elena Rossi',
    'Live session detailing impasto layer formulation.',
    'Experience the artist''s tactile studio workflow transported directly to our Milanesian showroom. Elena will host painting demonstrations over three consecutive evenings.',
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=800',
    '{"https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=800"}',
    NULL,
    '2026-07-01',
    'The Atrium Gallery, Milan',
    'published',
    3
),
(
    'e4444444-4444-4444-4444-444444444444',
    'future-art-valuation',
    'The Future of Fine Art Asset Valuation',
    'Co-hosted roundtable on physical to digital art trends.',
    'A distinguished panel consisting of museum directors, ledger technicians, and market analysts debating high-value asset authentication in the digital era.',
    'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=800',
    '{"https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=800"}',
    NULL,
    '2026-06-15',
    'Grand Editorial Library, Paris',
    'published',
    4
)
ON CONFLICT (id) DO NOTHING;
