import React, { Component } from 'react';
import './App.css';
import * as firebase from 'firebase';

const firebaseConfig = {databaseURL: "https://test-project-c1b2f.firebaseio.com/"};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

class App extends Component {
  constructor(props) {
    super();

    this.handleTaskListChange = this.handleTaskListChange.bind(this);
    this.handleProjectListChange = this.handleProjectListChange.bind(this);
    this.handleNewTaskNameChange = this.handleNewTaskNameChange.bind(this);
    this.handleAddNewTask = this.handleAddNewTask.bind(this);
    this.handleNewProjectNameChange = this.handleNewProjectNameChange.bind(this);
    this.handleAddNewProject = this.handleAddNewProject.bind(this);
    this.handleViewProject = this.handleViewProject.bind(this);
    this.handleProjectsStateChange = this.handleProjectsStateChange.bind(this);

    this.renderTaskWithList = this.renderTaskWithList.bind(this);
    this.renderProjectWithList = this.renderProjectWithList.bind(this);

    this.state = {tasks: [], projects: [], currentProject: ''};
    db.ref('projects').on('value', this.handleProjectsStateChange);
  }

  // Handle when the list of projects changes from Firebase.
  handleProjectsStateChange(snapshot) {
    this.setState({projects: snapshot.val() || []});

    if (this.state.currentProject == '') {
      this.switchToProject(0);
    }
  }

  renderTasks() {
    return (
      <List items={this.state.tasks} renderItem={this.renderTaskWithList} onChange={this.handleTaskListChange}/>
    );
  }

  // Callback for the List class for rendering an individual task.
  renderTaskWithList(list, taskName, taskIndex) {
    return <Task taskName={taskName} onDelete={() => list.deleteItem(taskIndex)} onMoveUp={() => list.moveItemUp(taskIndex)} onMoveDown={() => list.moveItemDown(taskIndex)} />
  }

  // Handle when the list of tasks changes locally.
  handleTaskListChange(tasks) {
    this.saveTasks(tasks);
    this.setState({tasks: tasks});
  }

  // Render the part of the page for adding a new task.
  renderNewTaskSelection() {
    return (
      <form>
        <input type="text" name="newTaskName" value={this.state.newTaskName} onChange={this.handleNewTaskNameChange} />
        <button type="button" onClick={this.handleAddNewTask}>Add New Task</button>
      </form>
    );
  }

  // Handle when the user changes the name of the task to add.
  handleNewTaskNameChange(e) {
    this.setState({newTaskName: e.target.value});
  }

  // Handle when the user adds a new task.
  handleAddNewTask() {
    this.addNewTask(this.state.newTaskName);
  }

  // Add a new task with the given name.
  addNewTask(newTaskName) {
    const tasks = this.state.tasks.slice();
    tasks.push(newTaskName);
    this.saveTasks(tasks);
    this.setState({tasks: tasks, newTaskName: ""});
  }

  // Render the current list of projects.
  renderProjects() {
    return (
      <List items={this.state.projects} renderItem={this.renderProjectWithList} onChange={this.handleProjectListChange}/>
    );
  }

  // Handle when a user requests to view a new project.
  handleViewProject(projectIndex) {
    this.switchToProject(projectIndex);
  }

  // Switch to the project with the given index.
  switchToProject(projectIndex) {
    const newCurrentProject = this.state.projects[projectIndex];
    const handleTasksStateChange = (snapshot) => this.setState({currentProject: newCurrentProject, tasks: snapshot.val() || []});

    db.ref('tasks/' + this.state.currentProject).off();
    db.ref('tasks/' + newCurrentProject).on('value', handleTasksStateChange);
  }

  // Callback for the List class for rendering an individual project.
  renderProjectWithList(list, projectName, projectIndex) {
    return <Project projectName={projectName} onDelete={() => list.deleteItem(projectIndex)} onMoveUp={() => list.moveItemUp(projectIndex)} onMoveDown={() => list.moveItemDown(projectIndex)} onViewProject={() => this.handleViewProject(projectIndex)} />
  }

  // Handle when the list of projects changes locally.
  handleProjectListChange(projects) {
    this.saveProjects(projects);
    this.setState({projects: projects});
  }

  // Render the part of the page for adding a new project.
  renderNewProjectSelection() {
    return (
      <form>
        <input type="text" name="newProjectName" value={this.state.newProjectName} onChange={this.handleNewProjectNameChange} />
        <button type="button" onClick={this.handleAddNewProject}>Add New Project</button>
      </form>
    );
  }

  // Handle when the user changes the name of the project to add.
  handleNewProjectNameChange(e) {
    this.setState({newProjectName: e.target.value});
  }

  // Save the given projects to firebase.
  saveProjects(projects) {
    db.ref('projects').set(projects);
  }

  // Save the given tasks to firebase for the current project.
  saveTasks(tasks) {
    db.ref('tasks/' + this.state.currentProject).set(tasks);
  }

  // Handle when the user adds a new project.
  handleAddNewProject() {
    this.addNewProject(this.state.newProjectName);
  }

  // Add a new project to the project list with the given project name.
  addNewProject(newProjectName) {
    const projects = this.state.projects.slice();
    projects.push(newProjectName);
    this.saveProjects(projects);
    this.setState({projects: projects, newProjectName: ""});
  }

  render() {
    return (
      <div>
        {this.renderProjects()}
        {this.renderNewProjectSelection()}
        <hr />
        <h3>{this.state.currentProject}</h3>
        {this.renderTasks()}
        {this.renderNewTaskSelection()}
      </div>
    );
  }
}

class Task extends Component {
  render() {
    return (
      <li>
        {this.props.taskName}&nbsp;
        <button type="button" onClick={this.props.onMoveUp}>Move Up</button>&nbsp;
        <button type="button" onClick={this.props.onMoveDown}>Move Down</button>&nbsp;
        <button type="button" onClick={this.props.onDelete}>Delete Task</button>
      </li>
    );
  }
}

class Project extends Component {
  render() {
    return (
      <li>
        {this.props.projectName}&nbsp;
        <button type="button" onClick={this.props.onMoveUp}>Move Up</button>&nbsp;
        <button type="button" onClick={this.props.onMoveDown}>Move Down</button>&nbsp;
        <button type="button" onClick={this.props.onDelete}>Delete Project</button>&nbsp;
        <button type="button" onClick={this.props.onViewProject}>View Project</button>
      </li>
    );
  }
}

// To create a List, you pass in props :renderItem: and :items:. :items: should
// be a list of items you want to display. When a List is rendered, :renderItem:
// will be called on once per item with the list object and each individual
// item. :renderItem should return the html for the item.
class List extends Component {
  render() {
    const items = this.props.items.map((itemDescription, itemIndex) => this.props.renderItem(this, itemDescription, itemIndex));

    return (
      <ul style={{listStyleType: "none"}}>
        {items}
      </ul>
    );
  }

  moveItemUp(itemIndex) {
    if (itemIndex > 0) {
      this.swapItems(itemIndex, itemIndex - 1);
    }
  }

  moveItemDown(itemIndex) {
    if (itemIndex < this.props.items.length - 1) {
      this.swapItems(itemIndex, itemIndex + 1);
    }
  }

  // Swap the position of the two items in this list at :itemIndex1: and :itemIndex2:
  swapItems(itemIndex1, itemIndex2) {
    const items = this.props.items.slice();
    const temp = items[itemIndex1];
    items[itemIndex1] = items[itemIndex2];
    items[itemIndex2] = temp;

    this.props.onChange(items);
  }

  // Delete the item at :itemIndex: in this list.
  deleteItem(itemIndex) {
    const items = this.props.items.slice();
    items.splice(itemIndex, 1);
    this.props.onChange(items);
  }
}

export default App;
