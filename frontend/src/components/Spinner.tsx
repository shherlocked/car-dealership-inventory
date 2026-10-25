/** Small loading spinner with an accessible label. */
export default function Spinner() {
  return (
    <span
      role="status"
      aria-label="Loading"
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80"
    />
  );
}
