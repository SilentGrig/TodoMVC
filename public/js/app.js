/*global jQuery, Handlebars, Router */
'use strict';

Handlebars.registerHelper('eq', (a, b, options) => a === b ? options.fn(this) : options.inverse(this));

const ENTER_KEY = 13;
const ESCAPE_KEY = 27;

var util = {
	uuid() {
		/*jshint bitwise:false */
		let i, random;
		let uuid = '';

		for (i = 0; i < 32; i++) {
			random = Math.random() * 16 | 0;
			if (i === 8 || i === 12 || i === 16 || i === 20) {
				uuid += '-';
			}
			uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
		}

		return uuid;
	},
	pluralize(count, word) {
		return count === 1 ? word : word + 's';
	},
	store(namespace, data) {
		if (arguments.length > 1) {
			return localStorage.setItem(namespace, JSON.stringify(data));
		} else {
			let store = localStorage.getItem(namespace);
			return (store && JSON.parse(store)) || [];
		}
	}
};

let App = {
	init() {
		this.todos = util.store('todos-jquery');
		this.todoTemplate = Handlebars.compile(document.getElementById('todo-template').text);
		this.footerTemplate = Handlebars.compile(document.getElementById('footer-template').text);
		this.bindEvents();

		new Router({
			'/:filter': function (filter) {
				this.filter = filter;
				this.render();
			}.bind(this)
		}).init('/all');
	},
	bindEvents: function() {
		document.getElementById('new-todo').addEventListener('keyup', this.create.bind(this));
		document.getElementById('toggle-all').addEventListener('change', this.toggleAll.bind(this));
		document.getElementById('footer').addEventListener('click', this.destroyCompleted.bind(this));
		let todoList = document.getElementById('todo-list');
		todoList.addEventListener('change', this.toggle.bind(this));
		todoList.addEventListener('dblclick', this.edit.bind(this));
		todoList.addEventListener('keyup', this.editKeyup.bind(this))
		todoList.addEventListener('focusout', this.update.bind(this))
		todoList.addEventListener('click', function(e) {
			if(e.target.classList.contains('destroy')) {
				this.destroy(e);
			}
		}.bind(this));
	},
	render() {
		let todos = this.getFilteredTodos();
		document.getElementById('todo-list').innerHTML = this.todoTemplate(todos);
		if(todos.length > 0) { document.getElementById('main').style.display = 'block' };
		document.getElementById('toggle-all').checked = (this.getActiveTodos().length === 0);
		this.renderFooter();
		document.getElementById('new-todo').focus();
		util.store('todos-jquery', this.todos);
	},
	renderFooter() {
		let todoCount = this.todos.length;
		let activeTodoCount = this.getActiveTodos().length;
		let template = this.footerTemplate({
			activeTodoCount: activeTodoCount,
			activeTodoWord: util.pluralize(activeTodoCount, 'item'),
			completedTodos: todoCount - activeTodoCount,
			filter: this.filter
		});

		let footer = document.getElementById('footer');
		if(todoCount > 0) { footer.style.display = 'block' };
		footer.innerHTML = template;
	},
	toggleAll(e) {
		let isChecked = e.target.checked;

		this.todos.forEach(todo => todo.completed = isChecked);

		this.render();
	},
	getActiveTodos() {
		return this.todos.filter(todo => !todo.completed);
	},
	getCompletedTodos() {
		return this.todos.filter(todo => todo.completed);
	},
	getFilteredTodos() {
		if (this.filter === 'active') {
			return this.getActiveTodos();
		}

		if (this.filter === 'completed') {
			return this.getCompletedTodos();
		}

		return this.todos;
	},
	destroyCompleted(e) {
		if(e.target.id !== 'clear-completed') return;
		this.todos = this.getActiveTodos();
		this.filter = 'all';
		this.render();
	},
	// accepts an element from inside the `.item` div and
	// returns the corresponding index in the `todos` array
	indexFromEl(el) {
		let id = el.closest('li').getAttribute('data-id');
		let todos = this.todos;
		
    return todos.findIndex(todo => todo.id === id);
	},
	create(e) {
		let input = e.target;
		let val = input.value.trim();

		if (e.which !== ENTER_KEY || !val) {
			return;
		}

		this.todos.push({
			id: util.uuid(),
			title: val,
			completed: false
		});

		input.value = '';

		this.render();
	},
	toggle(e) {
		if(!e.target.classList.contains('toggle')) return;
		let i = this.indexFromEl(e.target);
		this.todos[i].completed = !this.todos[i].completed;
		this.render();
	},
	edit(e) {
		if(e.target.tagName !== 'LABEL') return;
		let li = e.target.closest('li');
		li.classList.add('editing');
		for(let i = 0; i < li.children.length; i++) {
			if(li.children[i].className === 'edit') {
				li.children[i].focus();
				break;
			}
		}
	},
	editKeyup(e) {
    let target = e.target;
    if(!target.classList.contains('edit')) return;
    switch (e.which) {
      case ESCAPE_KEY:
        target.setAttribute('abort', true);
      case ENTER_KEY:
        target.blur();
        break;
		}
	},
	update(e) {
		let el = e.target;
		if(!el.classList.contains('edit')) return;
		let val = el.value.trim();

		if (!val) {
			this.destroy(e);
			return;
		}

		if (el.getAttribute('abort')) {
			el.setAttribute('abort', false);
		} else {
			this.todos[this.indexFromEl(el)].title = val;
		}

		this.render();
	},
	destroy(e) {
		this.todos.splice(this.indexFromEl(e.target), 1);
		this.render();
	}
};

App.init();