Tasks = new Mongo.Collection("tasks");

// Add 'notes' collection
Notes = new Mongo.Collection("notes");


if (Meteor.isServer) {
  Meteor.publish("notes",function(){
    return Notes.find({});
  });
  Meteor.publish("tasks",function(){
    return Tasks.find({
      $or: [
        {private: {$ne: true}},
        {owner: this.userId}
      ]
    });
  });
};
if (Meteor.isClient) {
  Meteor.subscribe("tasks");
  Meteor.subscribe("notes");
  Session.setDefault('editForm', false);
  Template.note.helpers({
    editPressed: function(){
      return Session.get('editForm');

    },

    val: function(){
      var note = Notes.findOne({task_id: Router.current().params._id});
      if(note){
        return note.content;
      }
    }
    
  });
  Template.note.events({
    "click .edit-btn": function(){
      Session.set('editForm', !Session.get('editForm'));
    },

    "submit .new-note":function(event){

      event.preventDefault();
      var note = event.target.content.value;
      Meteor.call('addNote',note,Router.current().params._id);
      Session.set('editForm', false);
    },
     "click .delete": function(){
      Meteor.call("removeNote", this._id);
    }
  });



  Template.home.helpers({
    tasks: function(){
      if(Session.get('hideCompleted')){
        // If hide completed is checked, filter tasks
        return Tasks.find({checked: {$ne: true}}, {sort: {createdAt: -1}})
      }else {
        // Otherwise, return all of the tasks
        return Tasks.find({}, {sort: {createdAt: -1}});
      }    
    },
    hideCompleted: function(){
      return Session.get('hideCompleted');
    },
    incompletedCount: function(){
      return Tasks.find({checked: {$ne: true}}).count();
    }
  });
  Template.home.events({
    "submit .new-task": function(event){
      //Prevent default browser form submit
      event.preventDefault();

      var text = event.target.text.value;

      Meteor.call("addTask",text);

      //clear form
      event.target.text.value= "";
    },
    "change .hide-completed input": function(){
      Session.set('hideCompleted', event.target.checked);
    }
  }); 
  Template.task.events({
    "click .toggle-checked": function(){

      Meteor.call("setChecked", this._id, !this.checked);
    },
    "click .delete": function(){
      Meteor.call("deleteTask", this._id);
    },
    "click .toggle-private": function(){
      Meteor.call("setPrivate", this._id, !this.private);
    }
  });
  Template.task.helpers({
    isOwner: function(){
      return this.owner === Meteor.userId();
    }
  });
  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });
}
Meteor.methods({
  addNote: function(note, taskId){
    Notes.insert({
      content: note,
      task_id: taskId
    });
  },
  removeNote: function(noteId){
    Notes.remove(noteId);
  },
  addTask: function(text){

    if (!Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Tasks.insert({
      text: text,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username
    });
  },

  deleteTask: function(taskId){
    var task = Tasks.findOne(taskId);
    if (task.private && task.owner !== Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    };
    Tasks.remove(taskId);
  },

  setChecked: function(taskId, setChecked){
    var task = Tasks.findOne(taskId);
    if (task.private && task.owner !== Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    };
    Tasks.update(taskId, {$set: {checked: setChecked}});
  },

  setPrivate: function(taskId, setToPrivate){
    var task = Tasks.findOne(taskId);

    if (task.owner !== Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    };

    Tasks.update(taskId, {$set: {private: setToPrivate}});
  }
});
