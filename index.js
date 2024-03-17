require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const app = express()
const Person = require('./models/person')

app.use(express.static('build'))
app.use(express.json())
app.use(morgan('tiny'))
app.use(cors())

/******************   GET  ******************************/
app.get('/info', (request, response, next) => {
  Person.find({})
    .then(persons => response.send(`<p>Phonebook has info for ${persons.length} people</p><p>${Date()}</p>`))
    .catch(error => next(error))
})
app.get('/api/persons', (request, response, next) => {
  Person.find({})
    .then(persons => response.json(persons))
    .catch(error => next(error))
})
app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      if(person)
        response.json(person)
      else
        response.status(404).end()
    })
    .catch(error => next(error))
})

/****************** DELETE ******************************/
app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(result => response.status(204).end())
    .catch(error => next(error))
})

/******************  POST  ******************************/
app.post('/api/persons', (request, response, next) => {
  const body = request.body

  if (body.name === undefined || body.number === undefined) {
    return response.status(400).json({ error: 'name or number missing' })
  }

  Person.find({})
    .then(persons => {
      if (persons.find((person) => person.name === body.name)){
        return response.status(400).json({ 
          error: 'name must be unique' 
        })
      }

      const person = new Person({
        name: body.name,
        number: body.number,
      })

      person.save()
        .then(savedPerson => response.json(savedPerson))
        .catch(error => next(error))
    })
    .catch(error => next(error))
})

/******************   PUT  ******************************/
app.put('/api/persons/:id', (request, response, next) => {

  const { name, number } = request.body
  Person.findById(request.params.id)
    .then(person => {
      if(person)
        Person.findByIdAndUpdate(
          request.params.id, 
          { name, number },
          { new: true, runValidators: true, context: 'query' }
        ) 
        .then(updatedPerson => {
          response.json(updatedPerson)
        })
        .catch(error => next(error))
      else
        response.status(404).json({error: "User not found"}).end()
    })
    .catch(error => next(error))
})





const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)


const errorHandler = (error, request, response, next) => {
  console.error(`${error.name}:${error.message}`)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

app.use(errorHandler)


const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})