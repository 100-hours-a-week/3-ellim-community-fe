const fieldStates = new Map();

function revokeObjectURL(state) {
    if (state.objectUrl) {
        URL.revokeObjectURL(state.objectUrl);
        state.objectUrl = null;
    }
}

function applyPreview(state, src, { isObjectUrl = false } = {}) {
    revokeObjectURL(state);

    const nextSrc = src || state.defaultImage || "";
    if (nextSrc) {
        state.preview.src = nextSrc;
        state.preview.removeAttribute("aria-hidden");
        state.trigger.classList.add("has-preview");
        if (isObjectUrl) {
            state.objectUrl = nextSrc;
        }
    } else {
        state.preview.removeAttribute("src");
        state.preview.setAttribute("aria-hidden", "true");
        state.trigger.classList.remove("has-preview");
    }
}

function handleInputChange(state) {
    const [file] = state.input.files || [];
    if (!file) {
        applyPreview(state, "");
        return;
    }
    const tempUrl = URL.createObjectURL(file);
    applyPreview(state, tempUrl, { isObjectUrl: true });
}

export function setupProfileImageField({
    inputId,
    previewId,
    triggerId,
    defaultImage = "",
} = {}) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const trigger = document.getElementById(triggerId);

    if (!input || !preview || !trigger) {
        return null;
    }

    const state = {
        input,
        preview,
        trigger,
        defaultImage,
        objectUrl: null,
    };

    fieldStates.set(inputId, state);
    input.addEventListener("change", () => handleInputChange(state));

    if (defaultImage) {
        applyPreview(state, defaultImage);
    } else {
        state.preview.setAttribute("aria-hidden", "true");
    }

    return state;
}

export function setProfileImagePreview(inputId, imageUrl) {
    const state = fieldStates.get(inputId);
    if (!state) {
        return;
    }
    applyPreview(state, imageUrl);
}
