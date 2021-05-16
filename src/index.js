const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());

const customers= [];

function getBalance(statement){

    statement.reduce((acc,operation)=>{
        if(operation.type === "credit"){
            return acc + operation.amount;
        }else{
            
            console.log("acc: "+ acc+" | "+ operation.amount);
            return acc - operation.amount;
        }
    },0)
}

function verifyExistsAccountNIF(request,response, next){
    const {nif} = request.headers;

    const customer = customers.find((customer)=>{return customer['nif'] === nif});
    if(!customer) {return response.status(400).json({error:"Customer not found"});}

    request.customer = customer;
    
    return next();
}


/**
 * nif = string
 * name = string
 * id = uuid
 * statement = []
 */
app.post("/account",(request,response)=>{
    const {nif,name}= request.body;

    const customerAlreadyExists = customers.some((customer)=>{
        return customer.nif === nif
    })

    if(customerAlreadyExists) return response.status(400).json({error:"Customer already exists!"})

    customers.push({
        nif,
        name,
        id: uuidv4(),
        statement:[]
    });
    return response.status(201).send();
})


app.get("/statement",verifyExistsAccountNIF,(request,response)=>{
    
    const {customer} = request;

    return response.json(customer.statement)
})

app.post("/deposit",verifyExistsAccountNIF,(request,response)=>{
    const { description,amount } = request.body;
    const { customer } = request;
    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }
    customer.statement.push(statementOperation);
    
    return response.status(201).send();
})

app.post("/withdraw",verifyExistsAccountNIF,(request,response)=>{
const{amount}=request.body;
const { customer }=request;
const balance = getBalance(customer.statement);

if(balance < amount){
    return response.status(400).json({error: "Insufficient funds!"});
}

const statementOperation = {
    amount,
    created_at: new Date(),
    type: "debit"
}

customer.statement.push(statementOperation);

return response.status(201).send();

})


app.get("/statement/date",verifyExistsAccountNIF,(request,response)=>{
    const {customer}= request;
    const {date} = request.query;

    const dateFormat = new Date(date + " 00:00"); 
    const statement = customer.statement.filter((statement)=>statement.created_at.toDateString() === new Date(dateFormat).toDateString());

    return response.json(statement);
})

app.put("/account",verifyExistsAccountNIF,(request,response)=>{
    const{name}=request.body;
    const{customer}=request;
    customer.name = name;
    return response.status(201).json(customer);

})

app.delete("/account",verifyExistsAccountNIF,(request,response)=>{
    const{customer}=request;

    customers.splice(customers.indexOf(customer,1),1);
    return response.status(200).json(customers);

})
app.listen(3333,()=>{
    console.log("Server is running on port 3333");
})