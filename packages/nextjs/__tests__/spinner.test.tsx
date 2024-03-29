import Spinner from "@/components/Spinner";
import { render } from "@testing-library/react";

describe("Spinner", () => {
  test("Should render spinner component unchanged", async () => {
    const { container } = render(<Spinner />);
    expect(container).toMatchSnapshot();
  });
});
