import React, { useState, useEffect } from 'react';
import gql from 'graphql-tag';
import { useMutation, useQuery } from '@apollo/react-hooks';

const GET_NAME = gql`
  {
    name
  }
`;
const CHANGE_NAME = gql`
  mutation changeName($name: String) {
    changeName(name: $name)
  }
`;

export default function NameChanger(props) {

  // fetch initial name from gql endpoint
  const [name, setNameState] = useState('');
  const { data: queryData, loading, error: queryError } = useQuery(GET_NAME);
  useEffect(() => {
    if(queryError) {
      setNameState('ERROR!');
    } else if (loading) { 
      setNameState('loading...'); 
    } else { setNameState(queryData.name); };
  },[queryData]);

  const [mutateName, { loading: l, error: mutateError }] = useMutation(CHANGE_NAME);

  function changeName(e) {
    // console.log(e.target.value);
    setNameState(e.target.value);
    mutateName({variables: { name: e.target.value} });
  }

  return (
    <div>
      <p>Hello {name}!</p>
      <input type='text'
        value={name}
        onChange={changeName}
      />
    </div>
   
  )
}