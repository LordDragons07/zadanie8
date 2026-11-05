"use strict";

window.addEventListener("DOMContentLoaded", function () {

    var storageKey = "feedbackFormData";
    var popupHash = "#feedback";
    var popup = document.getElementById("popup");
    var openButton = document.getElementById("open-button");
    var closeButton = document.getElementById("close-button");
    var form = document.getElementById("feedback-form");
    var submitButton = document.getElementById("submit-button");
    var statusMessage = document.getElementById("status");
    var fields = form.querySelectorAll("input, textarea");

    function showStatus(text, isError) {
        statusMessage.textContent = text;
        statusMessage.className = isError ? "status status-error" : "status status-success";
    }

    function clearStatus() {
        statusMessage.textContent = "";
        statusMessage.className = "status";
    }

    function saveData() {
        var data = {};

        fields.forEach(function (field) {
            data[field.name] = field.type === "checkbox" ? field.checked : field.value;
        });

        try {
            localStorage.setItem(storageKey, JSON.stringify(data));
        } catch (ignore) {
            return;
        }
    }

    function restoreData() {
        var data = null;

        try {
            data = JSON.parse(localStorage.getItem(storageKey));
        } catch (ignore) {
            data = null;
        }

        if (!data) {
            return;
        }

        fields.forEach(function (field) {
            if (data[field.name] === undefined) {
                return;
            }
            if (field.type === "checkbox") {
                field.checked = data[field.name] === true;
            } else {
                field.value = data[field.name];
            }
        });
    }

    function clearData() {
        try {
            localStorage.removeItem(storageKey);
        } catch (ignore) {
            return;
        }
    }

    function showPopup() {
        popup.hidden = false;
        document.body.classList.add("no-scroll");
        document.getElementById("fio").focus();
    }

    function hidePopup() {
        popup.hidden = true;
        document.body.classList.remove("no-scroll");
        clearStatus();
        openButton.focus();
    }

    function openForm() {
        if (!popup.hidden) {
            return;
        }
        history.pushState({feedback: true}, "", popupHash);
        showPopup();
    }

    function closeForm() {
        if (history.state && history.state.feedback) {
            history.back();
        } else {
            hidePopup();
        }
    }

    function sendForm(event) {
        event.preventDefault();

        if (!form.reportValidity()) {
            return;
        }

        clearStatus();
        submitButton.disabled = true;

        fetch(form.action, {
            method: "POST",
            headers: {"Accept": "application/json"},
            body: new FormData(form)
        }).then(function (response) {
            return response.json();
        }).then(function (data) {
            if (data.code === 200) {
                form.reset();
                clearData();
                showStatus("Спасибо! Сообщение успешно отправлено.", false);
            } else {
                showStatus("Ошибка отправки: " + (data.message || "попробуйте позже."), true);
            }
        }).catch(function () {
            showStatus("Не удалось отправить сообщение. Проверьте подключение к интернету и повторите попытку.", true);
        }).finally(function () {
            submitButton.disabled = false;
        });
    }

    restoreData();

    fields.forEach(function (field) {
        field.addEventListener("input", saveData);
        field.addEventListener("change", saveData);
    });

    openButton.addEventListener("click", openForm);
    closeButton.addEventListener("click", closeForm);
    form.addEventListener("submit", sendForm);

    popup.addEventListener("click", function (event) {
        if (event.target === popup) {
            closeForm();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !popup.hidden) {
            closeForm();
        }
    });

    window.addEventListener("popstate", function (event) {
        if (event.state && event.state.feedback) {
            showPopup();
        } else {
            hidePopup();
        }
    });

    if (window.location.hash === popupHash) {
        history.replaceState(null, "", window.location.pathname + window.location.search);
        openForm();
    }

});
