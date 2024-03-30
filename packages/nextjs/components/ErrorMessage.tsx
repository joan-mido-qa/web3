interface Props {
  message: string;
}

export default function ErrorMessage({ message }: Props) {
  return (
    <div className="z-50 absolute bottom-5 left-5 bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
      {message}
    </div>
  );
}
