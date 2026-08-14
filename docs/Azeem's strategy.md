Yes. **Azeem's strategy is the right direction**, and I would actually make it part of the Rotator architecture from the beginning.

The key is to separate **selection** from **delivery**.

We do **not** need to calculate a new rotation result every time somebody scans.

Instead:

```text
Every 1 minute
        ↓
Generate the current deal arrangement
        ↓
Cache it
        ↓
Everyone scanning during that minute
        ↓
Gets the same arrangement
```

So if 100 people scan Amaka Mall within the same minute, we don't make 100 separate database/rotation decisions.

We make **one**.

## Example

At:

**10:31:00**

Vemtap generates:

```text
Amaka Mall

Featured Deals

1. Restaurant A
2. Pharmacy B
3. Salon C
5. Laundry D
```

That result is cached.

Then:

```text
10:31:05 → Customer 1 → same result
10:31:12 → Customer 2 → same result
10:31:24 → Customer 3 → same result
10:31:47 → Customer 4 → same result
10:31:59 → Customer 100 → same result
```

At:

**10:32:00**

the Rotator generates a new arrangement:

```text
1. Pharmacy B
2. Boutique E
3. Restaurant A
4. Gym F
5. Salon C
```

And everyone in that minute gets the new result.

This is much more scalable.

---

# But I would make one important refinement

I wouldn't call the one-minute period simply a **"rotation period."**

I'd call it a:

### **Rotation Window**

For example:

```text
Cluster:
Amaka Mall

Rotation Window:
60 seconds

Current Window:
10:31:00 – 10:31:59
```

Within that window, the **selected deal set is fixed**.

At the next window, the system recalculates.

That gives the backend team a very clean mental model.

---

# Why this is better

Suppose:

```text
100 customers
```

scan simultaneously.

Without caching:

```text
100 requests
→ eligibility checks
→ rotation calculation
→ database access
→ deal selection
```

With the rotation-window model:

```text
First request
    ↓
Generate selection
    ↓
Cache
    ↓
99 subsequent requests
    ↓
Read cached selection
```

The difference becomes enormous when traffic grows.

And the cache can sit in Redis or another appropriate caching layer, while the underlying database remains the source of truth.

---

# I would actually separate the cached data into two layers

This is important as Vemtap grows.

## Layer 1 — Cluster Deal Pool

This changes relatively slowly.

For Amaka Mall:

```text
Eligible deals:
70
```

This can be cached for a longer period.

It only needs to be refreshed when something relevant happens, such as:

* business becomes inactive;
* deal is created;
* deal expires;
* deal is paused;
* cluster changes;
* Admin changes rotation settings.

---

## Layer 2 — Current Rotation Result

This is the one-minute result.

For example:

```text
Amaka Mall
Rotation Window:
10:31

Selected:
A
B
C
D
E
```

This is what customers actually receive.

So:

```text
Database
   ↓
Cached eligible pool
   ↓
Rotation engine
   ↓
Cached current result
   ↓
Customers
```

That's considerably more efficient than querying everything on every scan.

---

# There's another advantage

It makes the customer experience **more coherent**.

Imagine 20 people standing beside each other scanning the same Amaka Mall QR.

If every person receives a completely different result, they might compare:

> "I got Restaurant A."

> "I got Pharmacy B."

> "I got Salon C."

That's not necessarily bad, but it can make the discovery experience feel unpredictable.

With a rotation window:

> Everyone currently discovering Amaka Mall sees the same featured selection.

Then the next window changes.

That makes the system feel intentional.

---

# But do we really need exactly 1 minute?

Not necessarily.

I would make the window **configurable internally**, but start with **60 seconds**.

For example:

```text
Rotation Window

30 seconds
60 seconds ← default
2 minutes
5 minutes
```

However, I would **not expose this to businesses**, and probably not expose it to normal Admins at first either.

The backend/platform team should control the value.

Why?

Because once we have actual traffic data, we may discover:

* 30 seconds is too expensive.
* 60 seconds is ideal.
* 5 minutes produces too little variety.

We should be able to tune it without redesigning the system.

---

# One thing we should NOT do

Don't use:

> "Every minute, randomly pick five deals from the entire database."

That's still wasteful and could produce poor results.

Instead:

### First establish the eligible pool.

```text
Amaka Mall
70 eligible deals
```

Then the rotation engine selects from that pool.

And that result gets cached for the window.

---

# What about deal expiry during the window?

This is an important edge case.

Suppose:

```text
Deal expires at 10:31:30
```

but the current rotation window is:

```text
10:31:00 – 10:31:59
```

We don't want to keep showing an expired deal until 10:32.

So the cache should not blindly ignore deal validity.

There are two ways to handle this.

### Simpler approach

Only allow deals whose expiry time extends beyond the current rotation window.

That means the rotation engine won't select a deal that is about to expire during the active window.

This is probably the cleanest approach for V1.

---

# What about manual Admin changes?

Another important edge case.

Suppose at 10:31:20 Admin pauses Restaurant A.

We don't necessarily want to wait until 10:32 for the cached result to disappear.

So certain actions should **invalidate the current cache immediately**.

For example:

```text
Admin pauses deal
        ↓
Invalidate Amaka Mall rotation cache
        ↓
Next request regenerates result
```

Same for:

* Deal deletion
* Deal expiry
* Business deactivation
* Cluster change
* Rotator setting change
* Admin manual override

This means the system gets the performance benefit of caching **without making the admin controls feel slow**.

---

# So the actual logic becomes

```text
Customer scans QR
       ↓
Identify Cluster
       ↓
Check Current Rotation Window Cache
       ↓
Cache exists?
   ↙          ↘
 YES           NO
  ↓             ↓
Return        Generate
cached        rotation
result          ↓
               Cache
                 ↓
              Return
```

That's the basic architecture.

---

# We can also make the cache key cluster-specific

Something conceptually like:

```text
rotation:{clusterId}:{windowId}
```

So:

```text
rotation:amaka-mall:10:31
rotation:banex-plaza:10:31
rotation:jabi-mall:10:31
```

Each cluster has its own current rotation.

That means Amaka Mall's traffic does not interfere with Banex Plaza's rotation.

---

# What if there are multiple QR codes in Amaka Mall?

That's where I'd make a product decision:

### Default

All QR codes belonging to the same cluster use the **same current rotation result**.

So:

```text
Amaka Mall QR #1
Amaka Mall QR #2
Amaka Mall QR #3
        ↓
Same cluster
        ↓
Same rotation window
        ↓
Same featured deals
```

This keeps the system simple and reduces computation further.

Later, if there is a reason to make the food court QR different from the main entrance QR, we can support **QR-level rotation groups**.

But don't introduce that complexity now unless needed.

---

# There's also a hidden benefit for analytics

Because we know the exact rotation result for each time window, we can record:

```text
10:31 window
A B C D E
```

Then:

```text
A impressions = X
B impressions = Y
C impressions = Z
```

This becomes much easier to analyse.

We know exactly what was available during that window.

---

# One thing I would change from our earlier design

Earlier we talked about:

> "Don't show the same deal to the same customer repeatedly."

With a strict one-minute cached result, **we should not implement per-customer deal selection yet**.

That would reintroduce a lot of computation.

Instead, for V1:

> **The rotation is cluster/window-based, not customer-based.**

Everyone sees the same current selection.

We can still track customer-level exposure for analytics, but we don't need to generate a unique selection for every person.

Later, once traffic and data justify it, we can introduce more sophisticated frequency controls.

---

# The V1 Rotator architecture I recommend

```text
                  VEMTAP CLUSTER
                       ↓
                Eligible Deal Pool
                       ↓
                Rotation Engine
                       ↓
             60-Second Rotation Window
                       ↓
                Cached Result
                       ↓
         ┌─────────────┴─────────────┐
         ↓             ↓             ↓
       User 1        User 2        User 100
         ↓             ↓             ↓
         └──── Same Featured Deals ──┘
                       ↓
                  Next Minute
                       ↓
               New Rotation Result
```

This gives you:

**Low database pressure**

**Low compute cost**

**Predictable behavior**

**Consistent customer experience**

**Scalability**

**Easy analytics**

And most importantly, it gives us a very clean foundation for the future **Boost Deal** system.

Later, Boost doesn't need to calculate a separate result for every user. It simply affects the **selection generated for each rotation window**.

For example:

```text
Before Boost

A weight 1
B weight 1
C weight 1
D weight 1

Next rotation window
→ A B C D
```

Later:

```text
A weight 5  ← boosted
B weight 1
C weight 1
D weight 1

Next rotation window
→ A A B C
```

Not literally duplicate cards, of course—the selection algorithm would handle distribution properly—but conceptually, **Boost influences the probability/priority of being included in the next cached rotation result**.

So I would approve Azeem's approach, with one refinement:

> **Use a cache-backed, cluster-level rotation window, starting at 60 seconds, with event-based cache invalidation whenever an important Admin/deal change occurs.**

That's a strong V1 architecture.