# VemTap Market Clusters & QR Discovery — A Story for the Product Team

> A plain-English walkthrough of the "one QR code, every deal in the market" feature: why we built it, how it feels to customers, businesses, and admins, and how we know it's working.

---

## 1. The problem we kept hearing

Customers walk into a busy market like **Banex** or **Apo Zone E** and have no idea what's on offer. Deals exist — posters, word of mouth, the occasional WhatsApp broadcast — but nothing ties them together.

Meanwhile, each VemTap business already has a QR code at its door. When a customer scans it, they see *that one business's* page. That's useful, but it stops at the doorstep. The customer can't see the fried-rice place two shops down, or the barber at the end of the row.

**The gap:** a single scan should open up the *whole market*, not just one shop.

---

## 2. The idea, in one line

> **Every market gets its own QR code. Scan it, and you see the best deals from every business in that market — fairly.**

Think of it like a **front door for the market**. One sign at the entrance, one QR on a poster, one sticker on a counter — and a customer is instantly inside the neighbourhood's deals.

We deliberately don't rely on GPS or "send me your location". Location improves things (sorting by distance), but the experience must work even when a customer says *no* to location permission. A QR on a poster always works.

---

## 3. Meet the cast

### Amina — the customer

Amina is shopping at Banex on a Saturday. She walks past a poster: *"Scan to see every deal in Banex Market."*

She scans. No app download, no sign-up, no "allow location?" popup. She's on a clean page that says:

> **Banex Market — 12 businesses, 34 live deals**

She filters to **Restaurants**, sorts by **Price: Low to High**, and grabs a ₦2,125 jollof combo she'd have walked right past. The deal even tells her it's 145m away.

Tomorrow she comes back. The same deals are there — but now a *different* business leads the list. Amina doesn't notice the mechanics; she just feels like the market keeps surfacing new things.

**If the market owner ever retires that QR** (a printed poster from last year), the scan shows a friendly "This QR code is no longer active" screen. No dead links, no confusion.

### Chinedu — the business owner

Chinedu runs a small shop. He already has a VemTap QR at his counter. His deal is now visible on the market page **and** on his own QR's page. His branch QR even shows a little link to its market — "See deals around you".

He doesn't need to do anything. He just gets more walk-ins, and in the dashboard he can watch his deal's claims grow.

**The fairness promise:** when a customer opens the market page, no one business hogs the top spot forever. Every 15 minutes, the spotlight rotates to a different business. Big shops don't drown out small ones. Everyone gets their turn at the front of the shelf.

### Mrs. Okoye — the platform admin

Mrs. Okoye is the person who turns a real-world market into a VemTap cluster. She clicks **New Cluster**, names it "Banex Market", drops a pin on the map, sets a 500m radius, and saves. VemTap generates the QR code instantly — she prints it and hands it to the market's association.

She can:

- **Activate / deactivate the QR** whenever she wants (retiring an old poster, launching a fresh campaign).
- See at a glance how many businesses are in the cluster, how many deals are live, and **how many scans** the QR has earned.
- Press **Auto-assign** to automatically drop every nearby business into the right cluster — no manual data entry.
- Watch the whole thing grow to hundreds of markets, each with one QR.

---

## 4. How it works (the simple version)

```
ONE MARKET  =  ONE CLUSTER  =  ONE QR CODE
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
   Customer scans            Every business in the
   the QR code               cluster's deals appear
   (no location needed)      (rotated fairly)
```

- **Clusters are created by admins** — they define the market's name, centre point, and radius.
- **Branches get attached** automatically (by location) or manually.
- **Deals are shown accurately** — only *live* deals from businesses that opted into the Discovery Network. Expired deals, paused deals, inactive shops — all filtered out.
- **Location is a bonus, not a requirement** — when a customer shares it, we sort deals by distance. When they don't, we use the market centre.
- **Deals are kept fresh** — the moment a business edits or ends a deal, the market page updates. No stale posters.

---

## 5. Why this design wins

| Concern | How we handle it |
| --- | --- |
| Customers decline location permission | The QR works with **zero** permission requests |
| GPS is inaccurate indoors (malls, markets) | The market QR is anchored to a *place*, not a person |
| Privacy worries | No tracking needed to show the market's deals |
| Big business hogs attention | **Fair rotation** gives every business the spotlight |
| Manual cluster maintenance | **Auto-assign** places businesses by location, admins approve |
| Printing/posting QRs at scale | One QR per market — manageable count nationwide |
| Dead/retired codes | Admins **deactivate** a QR; scans show a friendly screen |

---

## 6. What we shipped (the scope)

**For customers**
- A public page at `/c/[market-code]` (the QR target) — though the page itself is a frontend follow-up, the backend and contract for it are ready.
- Cluster context (name, members, QR health) and a full deals feed with:
  - Filters: category, text search
  - Sorts: **Fair** (default), Newest, Price ↑/↓, Distance ↑/↓
- Branch QR pages now carry a link to their market (discovery gateway).

**For admins**
- Create / view / edit / delete clusters.
- Add or remove businesses manually.
- **Auto-assign** businesses to clusters by location (with a preview).
- **Turn a market's QR on or off** at any time.
- Live stats: member count, live-deal count, total scans.

**Out of scope for now (deliberately)**
- Paid/sponsored placements in the market feed (a future monetisation layer — the data model already has room for it).
- The customer-facing `/c/[code]` page and admin UI screens (frontend build).

---

## 7. How we'll know it's working

- **Scans per cluster QR** (`scanCount`) — did the market actually adopt it?
- **Deals claimed from the market page** — did scans turn into footfall?
- **Coverage** — what % of businesses in each cluster have a live deal?
- **Fairness health** — are small businesses getting claimed too, or only the big names?
- **Admin velocity** — how long does it take to spin up a new market?

---

## 8. The roadmap story

**We are here.** The engine is built and tested: 77 automated tests pass, the database migration is applied, and the API is ready for the frontend.

**Next chapter.** Build the pretty `/c/[code]` page customers land on, and the admin cluster manager screens.

**Later chapters.** Sponsored placements inside the market feed, per-cluster analytics dashboards for admins, and letting businesses opt their deals into multiple nearby markets.

---

*From a plain QR on a shop door to the front door of an entire market — that's the story we're telling.*
