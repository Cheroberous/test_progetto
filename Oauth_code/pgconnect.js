const {Client} = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'RDC',
    password: 'postgres',
    port: 5432,
});
client.connect();

const text = 'INSERT INTO utenti(id_utente) VALUES ($1) RETURNING *'
const values = ['idprova']

//callback
client.query(text, values, (err, res) => {
    if(err){
        console.log(err.stack)
    } else {
        console.log(res,rows[0])
        //{id_utente: 'idprova'}
    }
})

//promise
client
    .query(text, values)
    .then(res => {
        console.log(res.rows[0])
        //{id_utente: 'idprova'}
    })
    .catch(e => console.error(e.stack))

// async/await
try {
    const res = await.client.query(text, values)
    console.log(res.rows[0])
    //{id_utente: 'idprova'}
} catch (err) {
    console.log(err.stack)
}