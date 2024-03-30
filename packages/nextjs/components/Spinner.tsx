export default function Spinner() {
	return (
		<div className="absolute right-1/2 bottom-1/2  transform translate-x-1/2 translate-y-1/2 ">
			<div className="border-t-transparent border-solid animate-spin  rounded-full border-blue-500 border-8 h-40 w-40"></div>
		</div>
	);
}
