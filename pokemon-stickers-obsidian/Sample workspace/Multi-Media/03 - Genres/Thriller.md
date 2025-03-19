---
tags: genre
pokemon:
  name: "Pokémon #480"
  image: https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/480.png
---

```dataview
TABLE seen, good
FROM "00 - Movies"
WHERE  contains(genre, "thriller")
SORT created DESC
```