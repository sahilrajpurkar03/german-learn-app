import "./conversation-character.css";

export function ConversationCharacter({ speaking, listening, response, name }: {
  speaking: boolean; listening: boolean; response: boolean | null; name: string;
}) {
  const state = speaking ? "speaking" : listening ? "listening" : response === true ? "encouraging" : response === false ? "thinking" : "ready";
  return <div className={`conversation-character character-${state}`} role="img" aria-label={`${name}, ${state}`} data-state={state}>
    <div className="character-shadow" />
    <div className="character-body">
      <div className="character-arm character-arm-left"><div className="character-hand" /></div>
      <div className="character-arm character-arm-right"><div className="character-hand" /></div>
      <div className="character-shirt"><div className="character-collar" /><div className="character-pocket" /></div>
      <div className="character-neck" />
      <div className="character-head">
        <div className="character-ear character-ear-left" /><div className="character-ear character-ear-right" />
        <div className="character-face">
          <div className="character-brow character-brow-left" /><div className="character-brow character-brow-right" />
          <div className="character-eye character-eye-left"><i /></div><div className="character-eye character-eye-right"><i /></div>
          <div className="character-nose" /><div className="character-mouth"><i /></div>
          <div className="character-cheek character-cheek-left" /><div className="character-cheek character-cheek-right" />
        </div>
        <div className="character-hair" /><div className="character-fringe" />
      </div>
    </div>
  </div>;
}