import Spinner from "@/components/Spinner";
import { render } from "@testing-library/react";

describe("Spinner", () => {
	test("Should render Spinner component unchanged", async () => {
		const { container } = render(<Spinner />);
		expect(container).toMatchSnapshot();
	});
});
