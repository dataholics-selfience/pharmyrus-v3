# Firestore Indexes for Pharmyrus

## Collections Structure

### 1. patent_cache_index (Fast Lookups)
```
Document ID: {hash} (generated from molecule + countries)

Fields:
- molecule_normalized: string (lowercase)
- countries_sorted: array of strings
- last_searched: timestamp
- total_patents: number
- hash: string

Purpose: O(1) lookups by hash
Size: Small (~200 bytes per doc)
```

### 2. patent_cache_data (Full Results)
```
Document ID: {hash} (same as index)

Fields:
- result: object (full SearchResult)
- cached_at: timestamp

Purpose: Store complete patent data
Size: Large (~50KB - 5MB per doc)
```

### 3. users/{userId}/search_history (User History)
```
Document ID: {jobId}

Fields:
- molecule: string
- countries: array
- totalPatents: number
- searchedAt: timestamp
- jobId: string

Purpose: Track user search history
```

## Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Cache - read by all authenticated users
    match /patent_cache_index/{hash} {
      allow read: if request.auth != null;
      allow write: if request.auth != null; // TODO: restrict to server
    }
    
    match /patent_cache_data/{hash} {
      allow read: if request.auth != null;
      allow write: if request.auth != null; // TODO: restrict to server
    }
    
    // User history - only owner
    match /users/{userId}/search_history/{jobId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Composite Indexes (Create in Firebase Console)

### For Cache Index Collection
1. Collection: `patent_cache_index`
   - Fields: `molecule_normalized` (Ascending), `last_searched` (Descending)
   - Use: Search by molecule and sort by recency

2. Collection: `patent_cache_index`
   - Fields: `total_patents` (Descending), `last_searched` (Descending)
   - Use: Get most searched molecules

### For User History
1. Collection: `users/{userId}/search_history`
   - Fields: `searchedAt` (Descending)
   - Use: Get user's recent searches

## Performance Optimization

### Cache Check Flow (< 100ms)
```
1. Generate hash from molecule + countries (instant)
2. Get patent_cache_index/{hash} (1 read, small doc)
3. If exists, get patent_cache_data/{hash} (1 read, large doc)
Total: 2 reads maximum
```

### Cache Save Flow (< 200ms)
```
1. Generate hash
2. Save to patent_cache_index/{hash} (1 write, small)
3. Save to patent_cache_data/{hash} (1 write, large)
Total: 2 writes
```

### Scalability
- **Millions of molecules**: O(1) hash lookup, no scanning
- **No expiration needed**: Data stays forever (patents don't change often)
- **Separate index/data**: Fast checks without loading full results

## Monitoring Queries

```javascript
// Get cache hit rate
db.collection('patent_cache_index')
  .orderBy('last_searched', 'desc')
  .limit(100)
  .get()

// Get most searched molecules
db.collection('patent_cache_index')
  .orderBy('total_patents', 'desc')
  .limit(20)
  .get()

// Get user search count
db.collection('users/{userId}/search_history')
  .count()
  .get()
```

## Migration Plan (if needed later)

If cache gets too large (>10M documents):
1. Add TTL (time-to-live) field to index
2. Cloud Function to delete old entries (>1 year)
3. Or move to Cloud Storage for rarely accessed data
