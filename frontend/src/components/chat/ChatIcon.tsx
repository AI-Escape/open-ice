export type ChatIconProps = {
  className?: string;
};

export function ChatIcon(props: ChatIconProps) {
  return (
    <svg
      className={props.className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      role="img"
      aria-label="Chat button icon"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-6l-4 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <circle cx="9" cy="11" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="12" cy="11" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="15" cy="11" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}
