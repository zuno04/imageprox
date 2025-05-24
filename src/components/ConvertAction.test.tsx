import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MockedFunction } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConvertAction from "./ConvertAction";
import imageCompression from "browser-image-compression";
// Import the mocked components (Vitest hoists vi.mock)

// Mock browser-image-compression
vi.mock("browser-image-compression", () => ({
  default: vi.fn(),
}));
const mockImageCompression = imageCompression as MockedFunction<
  typeof imageCompression
>;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("ConvertAction Component", () => {
  const mockSetConverted = vi.fn();
  const sampleImages = [
    new File(["dummy_content_1"], "image1.jpg", { type: "image/jpeg" }),
  ];
  const sampleImagesPNG = [
    new File(["dummy_content_png"], "imagePNG.png", { type: "image/png" }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    // Default mock implementation
    mockImageCompression.mockImplementation(async (file, options) => {
      let fileName = file.name;
      if (options?.fileType) {
        const ext = options.fileType.split("/")[1];
        fileName = `${file.name.split(".")[0]}.${ext}`;
      }
      return new File(["compressed_dummy"], fileName, {
        type: options?.fileType || file.type,
      });
    });
  });

  const renderComponent = (images = sampleImages) => {
    return render(
      <ConvertAction images={images} setConverted={mockSetConverted} />
    );
  };

  it("renders correctly with initial default UI elements", () => {
    renderComponent();
    expect(screen.getByLabelText(/Max Size \(MB\)/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Max Width\/Height \(px\)/i)
    ).toBeInTheDocument();
    // For mocked components, getByLabelText might fail if <label for> isn't connected to a real input/select.
    // We'll check for the label text itself, and then interact via testids on the mocks.
    expect(screen.getByText(/Output Format/i)).toBeInTheDocument(); // Check label text exists
    expect(screen.getByTestId("global-mock-select")).toBeInTheDocument(); // Check our mock is rendered

    expect(screen.getByText(/Compression Mode/i)).toBeInTheDocument();
    expect(screen.getByTestId("global-mock-radiogroup")).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Aggressive \(Smaller Size\)/i)
    ).toBeInTheDocument(); // Mocked RadioGroupItem contains label and input
    expect(
      screen.getByLabelText(/High Quality \(Larger Size\)/i)
    ).toBeInTheDocument();

    expect(screen.getByText(/Keep EXIF Data/i)).toBeInTheDocument(); // Label is separate from checkbox mock
    expect(
      screen.getByTestId("global-mock-checkbox-input-keepExif")
    ).toBeInTheDocument(); // Check actual input in mock

    expect(
      screen.getByRole("button", { name: /Convert/i })
    ).toBeInTheDocument();
  });

  it("calls imageCompression with default options on conversion", async () => {
    renderComponent();
    const convertButton = screen.getByRole("button", {
      name: /Convert \(1\)/i,
    });
    await act(async () => {
      await userEvent.click(convertButton);
    });

    expect(mockImageCompression).toHaveBeenCalledWith(
      sampleImages[0],
      expect.objectContaining({
        maxSizeMB: 1, // Default
        maxWidthOrHeight: 1920, // Default
        initialQuality: 0.8, // Default for 'lossy'
        preserveExif: false, // Default
        alwaysKeepResolution: false, // Default for 'lossy'
        // fileType should not be set for 'original'
      })
    );
    expect(mockImageCompression.mock.calls[0][1].fileType).toBeUndefined();
    expect(mockSetConverted).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ image_name: "Reduced_image1.jpg" }),
      ])
    );
  });

  describe("Output Format Conversion", () => {
    it.each([
      { format: "PNG", fileType: "image/png", expectedExtension: "png" },
      { format: "JPG", fileType: "image/jpeg", expectedExtension: "jpeg" },
      { format: "WEBP", fileType: "image/webp", expectedExtension: "webp" },
    ])(
      "converts to $format correctly",
      async ({ fileType, expectedExtension }) => {
        await act(async () => {
          renderComponent(sampleImagesPNG);
        });

        const itemToClick = screen.getByTestId(
          `global-mock-select-item-${fileType}`
        );
        // Ensure the SelectTrigger is "clicked" first if the items are conditionally rendered (common in real Selects)
        // For the current global mock, items are always present, but good practice if mock evolves.
        const selectTrigger = screen.getByTestId("global-mock-select-trigger");
        await act(async () => {
          await userEvent.click(selectTrigger); // To simulate opening dropdown if necessary
          await userEvent.click(itemToClick);
        });

        const convertButton = screen.getByRole("button", {
          name: /Convert \(1\)/i,
        });
        await act(async () => {
          await userEvent.click(convertButton);
        });

        expect(mockImageCompression).toHaveBeenCalledWith(
          sampleImagesPNG[0],
          expect.objectContaining({ fileType })
        );
        expect(mockSetConverted).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              image_name: `Reduced_imagePNG.${expectedExtension}`,
            }),
          ])
        );
      }
    );

    it('keeps original format if "Keep Original Format" is selected', async () => {
      renderComponent();
      // Select PNG then back to original
      const pngItem = screen.getByTestId("global-mock-select-item-image/png");
      const originalItem = screen.getByTestId(
        "global-mock-select-item-original"
      );
      const selectTrigger = screen.getByTestId("global-mock-select-trigger");

      await act(async () => {
        await userEvent.click(selectTrigger); // Open
        await userEvent.click(pngItem); // Click PNG
      });
      await act(async () => {
        // No need to click trigger again if items remain visible or mock handles it
        await userEvent.click(originalItem); // Click Original
      });

      const convertButton = screen.getByRole("button", {
        name: /Convert \(1\)/i,
      });
      await act(async () => {
        await userEvent.click(convertButton);
      });

      expect(mockImageCompression.mock.calls[0][1].fileType).toBeUndefined();
      expect(mockSetConverted).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ image_name: "Reduced_image1.jpg" }),
        ])
      );
    });
  });

  describe("Compression Mode", () => {
    it("uses High Quality settings when selected", async () => {
      await act(async () => {
        renderComponent();
      });
      // The RadioGroupItem mock's container is now what receives the click.
      // The label is associated with the hidden input, but clicking the container (which includes the visible label) is more robust.
      const highQualityRadioContainer = screen.getByTestId(
        "global-mock-radiogroup-item-container-high"
      );
      await act(async () => {
        await userEvent.click(highQualityRadioContainer);
      });

      const convertButton = screen.getByRole("button", {
        name: /Convert \(1\)/i,
      });
      await act(async () => {
        await userEvent.click(convertButton);
      });

      expect(mockImageCompression).toHaveBeenCalledWith(
        sampleImages[0],
        expect.objectContaining({
          initialQuality: 1.0,
          alwaysKeepResolution: true,
        })
      );
    });

    it("uses Aggressive (lossy) settings by default and when selected", async () => {
      renderComponent();
      // Default is already lossy
      let convertButton = screen.getByRole("button", {
        name: /Convert \(1\)/i,
      });
      await act(async () => {
        await userEvent.click(convertButton);
      });

      expect(mockImageCompression).toHaveBeenCalledWith(
        sampleImages[0],
        expect.objectContaining({
          initialQuality: 0.8,
          alwaysKeepResolution: false,
        })
      );
      mockImageCompression.mockClear(); // Clear for next check

      // Explicitly select lossy
      const aggressiveRadioContainer = screen.getByTestId(
        "global-mock-radiogroup-item-container-lossy"
      );
      await act(async () => {
        await userEvent.click(aggressiveRadioContainer);
      });
      convertButton = screen.getByRole("button", { name: /Convert \(1\)/i });
      await act(async () => {
        await userEvent.click(convertButton);
      });

      expect(mockImageCompression).toHaveBeenCalledWith(
        sampleImages[0],
        expect.objectContaining({
          initialQuality: 0.8,
          alwaysKeepResolution: false,
        })
      );
    });
  });

  describe("EXIF Metadata", () => {
    it("preserves EXIF when checkbox is checked", async () => {
      await act(async () => {
        renderComponent();
      });
      // The global mock for Checkbox has the input directly inside.
      // Clicking the label associated with it or the input itself.
      const keepExifCheckbox = screen.getByLabelText(/Keep EXIF Data/i); // This targets the input via its associated label
      await act(async () => {
        await userEvent.click(keepExifCheckbox);
      });

      const convertButton = screen.getByRole("button", {
        name: /Convert \(1\)/i,
      });
      await act(async () => {
        await userEvent.click(convertButton);
      });

      expect(mockImageCompression).toHaveBeenCalledWith(
        sampleImages[0],
        expect.objectContaining({ preserveExif: true })
      );
    });

    it("does not preserve EXIF when checkbox is unchecked (default)", async () => {
      renderComponent();
      // Default is unchecked
      const convertButton = screen.getByRole("button", {
        name: /Convert \(1\)/i,
      });
      await act(async () => {
        await userEvent.click(convertButton);
      });

      expect(mockImageCompression).toHaveBeenCalledWith(
        sampleImages[0],
        expect.objectContaining({ preserveExif: false })
      );
    });
  });

  describe("Interaction of Options", () => {
    it("combines WEBP, High Quality, and Keep EXIF correctly", async () => {
      renderComponent(sampleImagesPNG);

      // Select WEBP
      const webpItem = screen.getByTestId("global-mock-select-item-image/webp");
      const selectTrigger = screen.getByTestId("global-mock-select-trigger");
      await act(async () => {
        await userEvent.click(selectTrigger);
        await userEvent.click(webpItem);
      });

      // Select High Quality
      const highQualityRadioContainer = screen.getByTestId(
        "global-mock-radiogroup-item-container-high"
      );
      await act(async () => {
        await userEvent.click(highQualityRadioContainer);
      });

      // Check Keep EXIF
      const keepExifCheckbox = screen.getByTestId(
        "global-mock-checkbox-input-keepExif"
      ); // Click input directly
      await act(async () => {
        await userEvent.click(keepExifCheckbox);
      });

      const convertButton = screen.getByRole("button", {
        name: /Convert \(1\)/i,
      });
      await act(async () => {
        await userEvent.click(convertButton);
      });

      expect(mockImageCompression).toHaveBeenCalledWith(
        sampleImagesPNG[0],
        expect.objectContaining({
          fileType: "image/webp",
          initialQuality: 1.0,
          alwaysKeepResolution: true,
          preserveExif: true,
        })
      );
      expect(mockSetConverted).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ image_name: "Reduced_imagePNG.webp" }),
        ])
      );
    });
  });

  describe("Local Storage Persistence", () => {
    it("loads and saves MaxSizeMB from/to localStorage", async () => {
      localStorageMock.setItem("compressionMaxSizeMB", JSON.stringify("0.5")); // Store as stringified string
      await act(async () => {
        renderComponent();
      });
      // Input value should be '0.5'
      expect(
        screen.getByLabelText<HTMLInputElement>(/Max Size \(MB\)/i).value
      ).toBe("0.5");

      const inputElement =
        screen.getByLabelText<HTMLInputElement>(/Max Size \(MB\)/i);
      await act(async () => {
        inputElement.focus(); // Focus before clear/type
        await userEvent.clear(inputElement);
        await userEvent.type(inputElement, "0.7");
        fireEvent.blur(inputElement); // Blur to trigger save
      });
      // handleMaxSizeChange saves it as a number, which JSON.stringify turns to "0.7"
      expect(localStorageMock.getItem("compressionMaxSizeMB")).toBe(
        JSON.stringify(0.7)
      );
    });

    it("loads and saves Output Format from/to localStorage", async () => {
      localStorageMock.setItem(
        "compressionOutputFormat",
        JSON.stringify("image/png")
      );
      let unmount: () => void;
      await act(async () => {
        const { unmount: u } = renderComponent();
        unmount = u;
      });

      const webpItem = screen.getByTestId("global-mock-select-item-image/webp");
      const selectTrigger = screen.getByTestId("global-mock-select-trigger");
      await act(async () => {
        await userEvent.click(selectTrigger);
        await userEvent.click(webpItem);
      });
      expect(localStorageMock.getItem("compressionOutputFormat")).toBe(
        JSON.stringify("image/webp")
      );

      await act(async () => {
        unmount!();
      });
      localStorageMock.setItem(
        "compressionOutputFormat",
        JSON.stringify("image/webp")
      );
      await act(async () => {
        render(
          <ConvertAction
            images={sampleImages}
            setConverted={mockSetConverted}
          />
        );
      });

      const convertButton = screen.getByRole("button", {
        name: /Convert \(1\)/i,
      });
      await act(async () => {
        await userEvent.click(convertButton);
      });
      expect(mockImageCompression).toHaveBeenCalledWith(
        sampleImages[0],
        expect.objectContaining({ fileType: "image/webp" })
      );
    });

    it("loads and saves Compression Mode from/to localStorage", async () => {
      localStorageMock.setItem(
        "compressionQualityMode",
        JSON.stringify("high")
      );
      let unmountFn: () => void;
      await act(async () => {
        const { unmount } = renderComponent();
        unmountFn = unmount;
      });
      expect(
        screen.getByTestId<HTMLInputElement>(
          "global-mock-radiogroup-input-high"
        ).checked
      ).toBe(true);

      const aggressiveRadioContainer = screen.getByTestId(
        "global-mock-radiogroup-item-container-lossy"
      );
      await act(async () => {
        await userEvent.click(aggressiveRadioContainer);
      });
      expect(localStorageMock.getItem("compressionQualityMode")).toBe(
        JSON.stringify("lossy")
      );

      await act(async () => {
        unmountFn!();
      });
      localStorageMock.setItem(
        "compressionQualityMode",
        JSON.stringify("lossy")
      );
      await act(async () => {
        renderComponent();
      });
      expect(
        screen.getByTestId<HTMLInputElement>(
          "global-mock-radiogroup-input-lossy"
        ).checked
      ).toBe(true);
    });

    it("loads and saves Keep EXIF from/to localStorage", async () => {
      localStorageMock.setItem("compressionKeepExif", JSON.stringify(true));
      let unmountFn: () => void;
      await act(async () => {
        const { unmount } = renderComponent();
        unmountFn = unmount;
      });
      expect(
        screen.getByTestId<HTMLInputElement>(
          "global-mock-checkbox-input-keepExif"
        ).checked
      ).toBe(true);

      const keepExifCheckboxInput = screen.getByTestId(
        "global-mock-checkbox-input-keepExif"
      );
      await act(async () => {
        await userEvent.click(keepExifCheckboxInput);
      });
      expect(localStorageMock.getItem("compressionKeepExif")).toBe(
        JSON.stringify(false)
      );

      await act(async () => {
        unmountFn!();
      });
      localStorageMock.setItem("compressionKeepExif", JSON.stringify(false));
      await act(async () => {
        renderComponent();
      });
      expect(
        screen.getByTestId<HTMLInputElement>(
          "global-mock-checkbox-input-keepExif"
        ).checked
      ).toBe(false);
    });
  });
});
