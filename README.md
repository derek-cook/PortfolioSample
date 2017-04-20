# README

This is a simple Ruby on Rails app that features authentication using the Devise Ruby gem.

# PortfolioSample

## Deploy and run server

To deploy from terminal, run `rails server` then go to your browser and navigate to `localhost:3000`
CTRL-C to stop the server.

## Rails console

To enter the console:  `rails console`

To exit: >`exit`

Some useful console commands:

* See all users in the database: `User.all`
* Find user by id: `User.find(1)` or replace the 1 with whatever User ID you want to query from the database
* Delete user from database: `User.find(1).destroy`
* Manually add new user (simulates user signup): 

```
> user = User.new({email: 'test@example.com', password: 'password', password_confirmation: 'password'})
> user.save
```
