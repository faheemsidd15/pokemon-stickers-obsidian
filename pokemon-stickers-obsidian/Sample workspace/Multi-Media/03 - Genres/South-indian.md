---
tags: genre
pokemon:
  name: "Pokémon #707"
  image: https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/707.png
---
```dataview
TABLE seen
FROM "00 - Movies"
WHERE  contains(genre, "south-indian")
SORT created DESC
```