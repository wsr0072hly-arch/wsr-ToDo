(function () {
  "use strict";

  var STORAGE_KEY = "todos.v1";
  var MAX_LENGTH = 200;

  var form = document.getElementById("todo-form");
  var input = document.getElementById("todo-input");
  var list = document.getElementById("todo-list");
  var emptyState = document.getElementById("empty-state");
  var countLabel = document.getElementById("count");
  var inputMessage = document.getElementById("input-message");

  var todos = load();

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function isValidItem(item) {
    return (
      item &&
      typeof item === "object" &&
      typeof item.id === "string" &&
      item.id !== "" &&
      typeof item.text === "string" &&
      item.text.trim() !== "" &&
      typeof item.done === "boolean"
    );
  }

  function normalizeItem(item) {
    var createdAt =
      typeof item.createdAt === "number" && isFinite(item.createdAt)
        ? item.createdAt
        : Date.now();
    return {
      id: item.id,
      text: item.text.trim(),
      done: item.done,
      createdAt: createdAt
    };
  }

  function load() {
    var raw;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      return [];
    }
    if (!raw) {
      return [];
    }
    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      return [];
    }
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isValidItem).map(normalizeItem);
  }

  function save() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch (err) {
      /* 存储不可用（隐私模式/配额）时忽略，保证页面仍可用 */
    }
  }

  function setMessage(text) {
    inputMessage.textContent = text || "";
  }

  function indexOfId(id) {
    for (var i = 0; i < todos.length; i++) {
      if (todos[i].id === id) {
        return i;
      }
    }
    return -1;
  }

  function addTodo(rawText) {
    var text = rawText.trim();
    if (!text) {
      setMessage("请输入任务内容，不能为空。");
      input.focus();
      return;
    }
    if (text.length > MAX_LENGTH) {
      text = text.slice(0, MAX_LENGTH);
    }
    setMessage("");
    todos.push({ id: makeId(), text: text, done: false, createdAt: Date.now() });
    save();
    render();
    input.value = "";
    input.focus();
  }

  function toggleTodo(id) {
    var index = indexOfId(id);
    if (index === -1) {
      render();
      return;
    }
    todos[index].done = !todos[index].done;
    save();
    render();
  }

  function removeTodo(id) {
    var index = indexOfId(id);
    if (index === -1) {
      render();
      return;
    }
    todos.splice(index, 1);
    save();
    render();
  }

  function render() {
    list.textContent = "";
    var doneCount = 0;

    todos.forEach(function (todo) {
      if (todo.done) {
        doneCount++;
      }

      var li = document.createElement("li");
      li.className = "todo-item" + (todo.done ? " is-done" : "");
      li.dataset.id = todo.id;

      var toggle = document.createElement("input");
      toggle.type = "checkbox";
      toggle.className = "todo-toggle";
      toggle.checked = todo.done;
      toggle.dataset.action = "toggle";
      toggle.setAttribute(
        "aria-label",
        (todo.done ? "恢复未完成：" : "标记完成：") + todo.text
      );

      var span = document.createElement("span");
      span.className = "todo-text";
      span.textContent = todo.text;

      var del = document.createElement("button");
      del.type = "button";
      del.className = "btn btn-delete";
      del.textContent = "删除";
      del.dataset.action = "delete";
      del.setAttribute("aria-label", "删除任务：" + todo.text);

      li.appendChild(toggle);
      li.appendChild(span);
      li.appendChild(del);
      list.appendChild(li);
    });

    emptyState.hidden = todos.length !== 0;
    countLabel.textContent =
      todos.length === 0
        ? ""
        : "共 " + todos.length + " 条，完成 " + doneCount + " 条";
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    addTodo(input.value);
  });

  input.addEventListener("input", function () {
    if (inputMessage.textContent) {
      setMessage("");
    }
  });

  list.addEventListener("click", function (event) {
    var target = event.target;
    if (!target || !target.dataset) {
      return;
    }
    var action = target.dataset.action;
    if (action !== "toggle" && action !== "delete") {
      return;
    }
    var li = target.closest("li.todo-item");
    if (!li) {
      return;
    }
    var id = li.dataset.id;
    if (action === "toggle") {
      toggleTodo(id);
    } else {
      removeTodo(id);
    }
  });

  render();
})();
