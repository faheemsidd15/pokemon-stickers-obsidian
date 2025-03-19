---
tags: genre
pokemon:
  name: Pikachu
  image: https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/26.png
---

```dataview
TABLE seen, good
FROM "00 - Movies"
WHERE  contains(genre, "horror")
SORT created DESC
```
