---
tags: genre
pokemon:
  name: "Pokémon #748"
  image: https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/748.png
---

```dataview
TABLE seen, good
FROM "00 - Movies"
WHERE  contains(genre, "fantasy")
SORT created DESC
```