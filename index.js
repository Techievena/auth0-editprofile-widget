import EditProfileForm  from './lib/EditProfileForm';
import Auth0Api         from './lib/ConnectionStrategy/Auth0Api';
import React            from 'react';

export default class Auth0EditProfileWidget {
    
  constructor (container_id, options, fields) {

    if (!(this instanceof Auth0EditProfileWidget)) {
        return new Auth0EditProfileWidget(options);
    }

    if (options.connection_strategy) {
      this.connection_strategy = options.connection_strategy;
    } else {
      this.connection_strategy = new Auth0Api(options.domain, options.user_token);
    }
    
    this.editProfile = new EditProfileForm();

    this.data = {
      errors: [],
      fields: fields
    };

    this.container = document.getElementById(container_id);

    this.events = {
      save:[],
      submit:[],
      error:[]
    };
  }

  init() {
    this.connection_strategy.get()
      .then(response => this.extendWithMetadata(response.user_metadata || {}) )
      .then(() => this.render() )
      .catch(e => this.on('error', e));
  }

  extendWithMetadata(metadata) {

    this.data.fields.forEach(function(field) {
      field.value = metadata[field.attribute] || null;
      return field;
    });

  }

  render() {
    this.editProfile.render(this.container, this.data, data => this.onSubmit(data));
  }

  on(event, callbackOrParam) {

    if ( ! this.events[event] ) {
      throw 'Invalid event';
    }

    if (typeof(callbackOrParam) === 'function') {
      this.events[event].push(callbackOrParam);
    }
    else {
      this.events[event].forEach(e => e(callbackOrParam));
    }

    return this;

  }

  onSubmit (data) {

    this.data.errors = [];

    var validation = this.data.fields.map(function(field) {
      if (field.validation) {
        return field.validation(data[field.attribute] || null) ;
      }
      return null;
    }).filter(value => value != null);

    if (validation.length > 0) {
      this.data.errors = validation;
      this.render();
      return;
    }

    this.on('submit', data);

    this.connection_strategy.patch(data)
      .then(response => (this.render(), response) )
      .then(response => this.on('save', response) )
      .catch(e => this.on('error', e));

  }

}

