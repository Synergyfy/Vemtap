# VEMTAP SMART DEAL ROTATOR

## What We Are Building and Why

### 1. The idea

Vemtap is going to have QR codes placed in different locations around businesses and commercial clusters.

For example:

**Amaka Mall**

One or more Vemtap QR codes can be placed at entrances, nearby locations, banners, tables, walls, or other strategic places.

When a customer scans the QR code, they enter the Vemtap discovery experience for that particular location/cluster and can see deals from Vemtap businesses in that market.

The important part is this:

> **The QR code does not decide which deal the customer sees. The Vemtap Smart Deal Rotator decides.**

The QR code identifies the location/cluster. The Rotator manages the deals shown to the customer.

---

# 2. Why we need the Rotator

Imagine Amaka Mall has:

* 30 Vemtap businesses
* 70 active deals
* 5,000 QR scans over time

We cannot simply show all 70 deals every time someone scans.

It would create a poor customer experience, and some businesses would receive too much exposure while others receive little or none.

Instead, we need a system that automatically decides:

* Which deals are eligible.
* Which deals should be shown.
* Which deals should be shown more or less often.
* Which deals have expired.
* Which deals are currently scheduled.
* Which deals have already been shown to this customer.
* Which deals should occupy the featured positions.

This system is the **Smart Deal Rotator**.

---

# 3. The basic flow

The entire process should work like this:

```text
Business creates a deal
        ↓
Deal becomes eligible for its market
        ↓
Customer scans the cluster QR
        ↓
Vemtap identifies the cluster
        ↓
Rotator finds eligible deals
        ↓
Rotator applies its rules
        ↓
Vemtap selects the deals to display
        ↓
Customer sees the deals
        ↓
Views, clicks and redemptions are recorded
```

This should happen automatically.

---

# 4. Businesses do not control the Rotator

The Rotator is an **Admin-controlled Vemtap system**.

Businesses create and manage their own deals, but they do not decide how the Rotator distributes deals.

At this stage there is also **no Boost Deal system**.

Boost Deal can be added later as a separate feature when Vemtap has enough users, businesses, traffic, and data.

For now, the goal is simply:

> **Build a reliable system that distributes organic business deals fairly and intelligently.**

---

# 5. Automatic is the default

This is one of the most important rules.

We are going to have many clusters.

We cannot expect Admin to manually manage the deal pool for every cluster.

Therefore:

> **Vemtap should automatically manage the normal operation of the Rotator.**

Admin can manually override the system when necessary.

The general model is:

```text
AUTOMATIC = DEFAULT

MANUAL = OVERRIDE
```

---

# 6. Eligible Deal Pool

By default, Vemtap should automatically include **all eligible active deals** belonging to that cluster.

For example:

```text
Amaka Mall

70 Active Deals

70 Automatically Eligible
```

Admin does not need to manually select all 70.

A deal is normally eligible when:

* The business is active.
* The deal is active.
* The deal belongs to the cluster.
* The deal has not expired.
* The deal is currently within its schedule.

If all conditions are satisfied, it enters the Rotator automatically.

---

## Manual override

Admin can still decide to take control.

For example:

```text
Eligibility

● Automatic
○ Manual
```

If Admin switches to Manual:

```text
70 Active Deals

52 Included
18 Excluded
```

Admin can then select individual deals.

This is only for special situations.

When Admin clicks:

**Reset to Automatic**

the system goes back to including all eligible deals.

---

# 7. Rotation Strategy

The system should also automatically determine how deals are distributed.

We can support three main approaches.

## Balanced Rotation

This is the normal starting approach.

Eligible deals receive a fair opportunity to appear over time.

Example:

```text
Restaurant A
Pharmacy B
Salon C
Laundry D
Boutique E
```

The system continuously rotates eligible deals so that one business does not permanently dominate the discovery experience.

---

## Weighted Rotation

Admin can give some deals a higher delivery weight.

Example:

```text
Restaurant A   3
Pharmacy B     2
Salon C        1
Laundry D      1
```

The numbers are weights, not guaranteed positions.

Restaurant A should receive more exposure over time than Laundry D.

This feature gives Admin control without having to manually decide every individual customer view.

---

## Scheduled Rotation

Deals can participate based on time.

For example:

```text
Lunch Deal
11:00 AM – 3:00 PM

Evening Deal
5:00 PM – 10:00 PM

Weekend Deal
Saturday – Sunday
```

When the schedule starts, the deal becomes eligible.

When the schedule ends, it automatically leaves the rotation.

When a deal expires, it automatically stops appearing.

This follows the same general idea of time-based rotation described in the attached rotator material. 

---

# 8. Featured Deals

We should not show 70 deals at once.

The discovery page can have a limited number of featured positions.

For example:

```text
Featured Deals

5 Slots
```

The Rotator automatically selects which eligible deals occupy those five positions.

Customer A could see:

```text
Restaurant A
Pharmacy B
Salon C
Laundry D
Boutique E
```

Customer B could see:

```text
Pharmacy B
Boutique E
Restaurant A
Gym F
Salon C
```

Customer C might see another combination.

The goal is to create **controlled rotation**, not a static list.

---

# 9. The number of slots should also be automatic

Admin should not have to configure the number of featured slots for every cluster.

By default:

```text
Featured Slots
Automatic
```

Vemtap can determine an appropriate number based on the experience and the number of available deals.

For example:

```text
8 eligible deals
→ 3 featured slots
```

or:

```text
70 eligible deals
→ 5 featured slots
```

Admin can override the number for a special cluster if necessary.

---

# 10. Frequency Control

We don't want the same customer to see the same deal repeatedly.

For example:

```text
Customer scans

Restaurant A

Customer scans again

Restaurant A

Customer scans again

Restaurant A
```

That would make the discovery experience frustrating.

The system should automatically keep track of exposure.

Conceptually:

```text
Customer
+
Deal
+
Cluster
+
Time
```

The Rotator can then reduce or temporarily stop the same deal from being shown again to that customer within the configured period.

The exact limits can be adjusted later using real usage data.

---

# 11. QR Codes

The QR code is simply the customer's entry point.

For example:

```text
AMAKA MALL QR
```

The QR tells Vemtap:

> "This customer is discovering Amaka Mall."

The system then uses the Amaka Mall Rotator.

The important principle is:

```text
QR = Where?

Rotator = What?

Rules = How?

Analytics = What happened?
```

---

# 12. Multiple QR Codes Can Use the Same Cluster Rotator

Suppose Amaka Mall has:

```text
QR 1 — Main Entrance
QR 2 — Parking
QR 3 — Food Court
QR 4 — Nearby Road
QR 5 — Other Location
```

By default, they can all use:

```text
Amaka Mall
        ↓
Same Deal Pool
        ↓
Same Rotator
```

This makes the QR system scalable.

We do not need a separate rotator for every physical QR unless Admin specifically wants different behavior.

---

# 13. QR-Specific Override

Later, Admin can optionally customize a specific QR.

Example:

### Main Entrance QR

```text
All Amaka Mall deals
Automatic rotation
```

### Food Court QR

```text
Restaurants
Cafes
Bakeries
Automatic rotation
```

But again, the default should be:

> **Inherit the cluster's automatic settings.**

Admin only changes this when there is a specific reason.

---

# 14. Deal Scheduling and Expiry

Every deal should automatically respect its validity.

For example:

```text
20% Off

Valid:
August 14 – August 20
```

At the end:

```text
August 20
        ↓
Deal expires
        ↓
Automatically removed from Rotator
        ↓
Another eligible deal takes its place
```

No Admin should have to manually remove expired deals.

---

# 15. What happens if there are fewer deals than slots?

Suppose:

```text
3 eligible deals

5 featured slots
```

We simply show the three.

We do not create empty placeholders.

We do not repeat the same deal just to fill space.

---

# 16. What happens when there are many deals?

Suppose:

```text
70 eligible deals
```

and:

```text
5 featured slots
```

The system does:

```text
70 eligible deals
        ↓
Apply eligibility
        ↓
Apply schedule
        ↓
Apply frequency
        ↓
Apply rotation
        ↓
Select 5
        ↓
Display
```

This continues automatically.

---

# 17. Admin should have a preview

Admin should be able to click:

**Preview Rotation**

and see simulated customer experiences.

Example:

### Preview 1

```text
Featured Deals

Restaurant A
Pharmacy B
Salon C
Laundry D
Boutique E
```

### Preview 2

```text
Featured Deals

Pharmacy B
Boutique E
Restaurant A
Gym F
Salon C
```

### Preview 3

```text
Featured Deals

Salon C
Restaurant A
Gym F
Laundry D
Pharmacy B
```

This lets Admin confirm that the rules are behaving correctly.

---

# 18. Admin should be able to see why something is showing

This will be very useful.

When Admin opens a deal:

### Why is this deal currently being shown?

```text
Restaurant A

Eligible: ✓
Business Active: ✓
Deal Active: ✓
Cluster Match: ✓
Not Expired: ✓
Schedule: ✓
Frequency Eligible: ✓

Rotation:
Automatic

Delivery Weight:
1.0

Current Status:
Eligible
```

And if it is not showing:

```text
Pharmacy B

Eligible: ✓
Business Active: ✓
Deal Active: ✓
Cluster Match: ✓
Expired: ✕
```

This gives Admin visibility into the system rather than making the Rotator a black box.

---

# 19. Global Defaults

Admin should be able to define the general Rotator rules once.

For example:

```text
Vemtap Rotator Defaults

Eligible Deals
→ All eligible active deals

Rotation
→ Automatic

Distribution
→ Balanced

Featured Slots
→ Automatic

Frequency
→ Automatic

Expired Deals
→ Remove automatically

Inactive Businesses
→ Remove automatically
```

Then all clusters inherit these defaults.

---

# 20. Cluster Overrides

Admin can override the defaults for a particular cluster.

Example:

```text
Global:
Balanced

Amaka Mall:
Automatic

Banex Plaza:
Manual Weighted
```

So Admin only manages exceptions.

---

# 21. Deal-Level Overrides

We can also allow an exception at individual deal level.

Example:

```text
Restaurant A

Delivery:
Automatic

Override:
Manual Weight = 3
```

The hierarchy becomes:

```text
Global Default
      ↓
Cluster Override
      ↓
QR Override
      ↓
Deal Override
```

The most specific rule wins.

---

# 22. Reset to Automatic

Every manual override should have:

**Reset to Automatic**

This is important.

Otherwise, over time Admin may make hundreds of manual changes and forget which clusters were changed.

We should always make it easy to return to the standard automated system.

---

# 23. Analytics

The Rotator should record what happens.

For the cluster:

```text
QR Scans

Unique People

Deal Impressions

Deal Views

Clicks

Redemptions
```

For each deal:

```text
Impressions

Unique Reach

Views

Clicks

Redemptions
```

The attached rotator material also highlights analytics and visitor tracking as an important part of the rotation system. 

Initially, these analytics are mainly for measurement.

Later, they can help Vemtap improve automatic rotation.

---

# 24. Future Smart Rotation

We should build the architecture so that eventually we can have:

```text
Rotation Strategy

Automatic
Balanced
Weighted
Smart
```

The future **Smart** mode can learn from:

* Deal freshness
* Exposure
* Views
* Redemptions
* Customer frequency
* Time
* Cluster activity

But we should **not start with AI or machine learning**.

First:

> Build the reliable automatic rotation system.

Then:

> Collect real customer behavior.

Then:

> Use the data to improve the automatic decisions.

---

# 25. Boost Deal Comes Later

We are **not building Boost Deal now**.

However, the Rotator should be designed so it can support it later.

Today:

```text
Organic Deal
        ↓
Automatic Rotation
        ↓
Customer
```

Later:

```text
Organic Deal
        ↓
Automatic Rotation

Boosted Deal
        ↓
Additional Delivery Rules
        ↓
Automatic Rotation
        ↓
Customer
```

So Boost Deal becomes an extension of the existing delivery engine, not a completely separate advertising system.

---

# 26. What We Are Ultimately Building

The final system should allow Vemtap to have:

```text
Hundreds of clusters
Thousands of businesses
Thousands of deals
Multiple QR codes
Millions of customer interactions
```

without requiring Admin to manually manage every deal every day.

The system should operate automatically.

Admin's role is to:

**Set the rules → Monitor the system → Make exceptions → Analyze results.**

Not:

**Manually select 50 deals every morning for every cluster.**

---

# 27. The Core Rule Everyone Should Remember

> **Automatic first. Manual only when necessary.**

Everything should inherit the automatic system unless Admin deliberately overrides it.

That applies to:

* Deal eligibility
* Rotation
* Featured slots
* Weights
* Scheduling
* Frequency
* QR configuration
* Future optimization

This is what makes the system scalable.

---

# The complete Vemtap flow

```text
                    BUSINESS
                       │
                 Creates a Deal
                       │
                       ▼
                 VEMTAP CORE
                       │
                Deal is eligible
                       │
                       ▼
                    CLUSTER
                       │
                    QR Code
                       │
                       ▼
                   CUSTOMER
                       │
                     Scan
                       │
                       ▼
              SMART DEAL ROTATOR
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   Eligibility     Frequency      Rotation
        │              │              │
        └──────────────┼──────────────┘
                       ▼
                Featured Deals
                       │
                       ▼
                   CUSTOMER
                       │
             View / Click / Redeem
                       │
                       ▼
                  ANALYTICS
                       │
                       ▼
              BETTER AUTOMATION
```

### In one sentence:

**We are building a Vemtap-controlled system that automatically decides which active business deals customers see when they scan a location's QR code, while giving Admin the ability to override the automation whenever necessary.**

That is the Rotator we should build now. **Boost Deal is simply a future layer that can plug into this same system once Vemtap has enough traffic and data.**