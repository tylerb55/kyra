import { useNavigate } from "react-router-dom";
import Axios from "axios";
import { useState } from "react";
import { useAccount } from '../../../App.jsx';

export default function AccountDetails() {
    const navigateTo = useNavigate();
    const {accountDetails} = useAccount();

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [prescription, setPrescription] = useState('');
    const [notes, setNotes] = useState('');

    const handleNameChange = (e) => setName(e.target.value);
    const handlePhoneChange = (e) => setPhone(e.target.value);
    const handleDiagnosisChange = (e) => setDiagnosis(e.target.value);
    const handlePrescriptionChange = (e) => setPrescription(e.target.value);
    const handleNotesChange = (e) => setNotes(e.target.value);
    const handleUserGroupChange = (e) => setUserGroup(e.target.value);
    const {setAccountDetails} = useAccount();

    const updateDetails = (e) => {
      e.preventDefault();
      Axios.post('http://16.171.196.43/api/createDetails', {
          Name: name,
          Email: accountDetails.email,
          Phone: phone,
          Diagnosis: diagnosis,
          Prescription: prescription,
          Notes: notes,
          User_Group: 'Patient'
      }).then((response) => {
          console.log(response);
          if (response.status === 201) {
              //alert('User created successfully');
              setAccountDetails({data: {name: name, email: accountDetails.email, phone: phone, diagnosis: diagnosis, prescription: prescription, notes: notes, user_group: 'Patient'}});
              navigateTo('/chat')
          } else {
              //alert('User creation failed');
              navigateTo('/register');
          }
      })
      .catch(error => {
          console.error('Error:', error.response ? error.response.data : error.message);
          alert(error.response ? error.response.data : error.message);
          navigateTo('/register');
      });
  }

    return (
        <div className="accountDetails">
            <h1>{accountDetails.email}</h1>
            <form action="/submit-form" method="post">
                <label htmlFor="name">Name:</label>
                <input type="text" id="name" name="name" onChange={handleNameChange} required/>
                <label htmlFor="email">Email:</label>
                <input type="email" id="email" name="email" value={accountDetails.email} disabled/>
                <label htmlFor="Phone">Phone:</label>
                <input type="text" id="Phone" name="Phone" onChange={handlePhoneChange} required/>        
                <label htmlFor="Diagnosis">Diagnosis:</label>
                <input type="text" id="Diagnosis" name="Diagnosis" onChange={handleDiagnosisChange} required/>
                <label htmlFor="Prescripton">Prescription:</label>
                <input type="text" id="Prescription" name="Prescription" onChange={handlePrescriptionChange} required/>
                <label htmlFor="User_Group">User Group:</label>
                <select id="multiSelect" name="User_Group" onChange={handleUserGroupChange} required>
                <option value="Patient" >Patient</option>
                <option value="Carer">Carer</option>
                </select>
                <label htmlFor="Notes">Notes:</label>
                <textarea id="Notes" name="Notes" onChange={handleNotesChange} required></textarea> 
                <button type="submit" onClick={updateDetails}>Update</button>    
            </form>
        </div>
    );
}