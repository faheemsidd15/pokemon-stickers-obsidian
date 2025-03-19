---
tags: genre
pokemon:
  name: "Pokémon #359"
  image: https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/359.png
---
```dataview
TABLE seen, good
FROM "00 - Movies"
WHERE  contains(genre, "romantic")
SORT created DESC
```