
Router.route('/',{
  name: 'home',
  template: 'home'
});
Router.route('/note/:_id',{
  name: 'note',
  template: 'note',
  data: function(){
    var currentTask = this.params._id;
    return Notes.findOne({task_id: currentTask});
  }
});
Router.configure({
    layoutTemplate: 'main'
});