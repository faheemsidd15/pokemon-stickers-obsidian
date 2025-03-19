---
title: <%* let movieTitle = await tp.system.prompt("Name of Movie"); tR += movieTitle %>
genre: <%* let movieGenre = await tp.system.prompt("Genre (comma-separated)"); tR += movieGenre %>
where_to_watch: <%* let watchLocation = await tp.system.prompt("Where to Watch? (Netflix, Hulu, etc.)"); tR += watchLocation %>
seen: <%* let seenIt = await tp.system.prompt("Seen it? (true/false)"); tR += seenIt %>
tags: movie, <% movieGenre %>
created: <% tp.date.now("YYYY-MM-DD") %>
---
**🎬 Movie Name:** <% movieTitle %>  
**📌 Genre:** [[<%* 
tR += movieGenre.split(", ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(", "); 
%>]]
**📺 Where to Watch:** [[<%* 
tR += watchLocation.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" "); 
%>]]

**✅ Seen It?** <% seenIt %>  

**📝 Notes:**  
-
<%* await tp.file.rename(movieTitle); %>