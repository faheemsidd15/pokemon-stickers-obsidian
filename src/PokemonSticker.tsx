interface PokemonStickerProps {
  pokemon: { name: string; image: string };
}

export default function PokemonSticker(props: PokemonStickerProps) {
  return (
    <div style={{ textAlign: "center", marginBottom: "1em" }}>
      <img src={props.pokemon.image} alt={props.pokemon.name} width={100} />
      <h2>{props.pokemon.name}</h2>
    </div>
  );
}
