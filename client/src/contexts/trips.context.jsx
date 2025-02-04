import React, { createContext, useState, useCallback, useContext } from "react";
import { AuthContext } from "./auth.context";
// import { useToasts } from "react-toast-notifications";
import { useAuth0 } from "@auth0/auth0-react";

let headers = {
  "Content-Type": "application/json",
  // 'Content-Type': 'application/x-www-form-urlencoded',
};

export const TripsContext = createContext({
  fetchTrips: () => [],
  addTrip: () => {},
  updateTrip: () => {},
  deleteTrip: () => {},
  loaded: false,
  loading: false,
  error: null,
  trips: [],
});

export const TripsProvider = (props) => {
  const { accessToken } = useContext(AuthContext);

  const [state, setState] = useState({
    loading: false,
    loaded: false,
    error: null,
    trips: [],
  });

  const { loading, error, trips, loaded } = state;
  // console.log('rerendering', {loading, error, trips, loaded});

  const setLoading = useCallback(
    () =>
      setState({
        ...state,
        loading: true,
      }),
    [state]
  );

  const setTrips = useCallback(
    (data) =>
      setState({
        ...state,
        trips: data,
        loading: false,
        loaded: true,
      }),
    [state]
  );

  const setError = useCallback(
    (err) =>
      setState({
        ...state,
        error: err.message || err.statusText,
        loading: false,
        loaded: true,
      }),
    [state]
  );

  // const [search, setSearch] = useState("");
  // const { addToast } = useToasts();

  const fetchTrips = useCallback(async () => {
    // console.log('loading', loading);
    // console.log('error', error);

    const { loading, loaded, error } = state;

    if (loading || loaded || error) {
      return;
    }

    setLoading();

    try {
      const response = await fetch("/api/v1/trips", {
        headers: accessToken
          ? { ...headers, Authorization: `Bearer ${accessToken}` }
          : headers,
      });
      if (!response.ok) {
        throw response;
      }
      const data = await response.json();
      setTrips(data);
      // console.log('trips from context', trips);
    } catch (err) {
      console.log("err", err);
      setError(err);
    }
  }, [accessToken, setError, setLoading, setTrips, state]);

  const addTrip = useCallback(
    async (formData) => {
      if (!accessToken) return;
      console.log("headers", headers);
      console.log("accessToken", accessToken);
      setLoading();
      const { trips } = state;
      try {
        const response = await fetch("/api/v1/trips", {
          method: "POST",
          headers: accessToken
            ? { ...headers, Authorization: `Bearer ${accessToken}` }
            : headers,
          body: JSON.stringify(formData),
        });
        if (response.status !== 201) {
          throw response;
        }
        const savedTrip = await response.json();
        console.log("got data", savedTrip);
        setTrips([...trips, savedTrip]);
        // addToast(`Saved ${savedTrip.title}`, {
        //   appearance: "success",
        // });
      } catch (err) {
        console.log(err);
        setState(err);
        // addToast(`Error ${err.message || err.statusText}`, {
        //   appearance: "error",
        // });
      }
    },
    [accessToken, /*addToast,*/ setLoading, setTrips, state]
  );

  const updateTrip = useCallback(
    async (id, updates) => {
      if (!accessToken) return;
      let newTrip = null;
      setLoading();
      const { trips } = state;
      try {
        const response = await fetch(`/api/v1/trips/${id}`, {
          method: "PUT",
          headers: accessToken
            ? { ...headers, Authorization: `Bearer ${accessToken}` }
            : headers,
          body: JSON.stringify(updates),
        });
        if (!response.ok) {
          throw response;
        }
        // Get index
        const index = trips.findIndex((trip) => trip._id === id);

        // Get actual trip
        const oldTrip = trips[index];
        console.log(
          "🚀 ~ file: trips.context.js ~ line 95 ~ updateTrip ~ oldTrip",
          oldTrip
        );

        // Merge with updates
        newTrip = {
          // legit use of 'var', so can be seen in catch block
          ...oldTrip,
          ...updates, // order here is important for the override!!
        };
        console.log(
          "🚀 ~ file: trips.context.js ~ line 99 ~ updateTrip ~ newTrip",
          newTrip
        );
        // recreate the trips array
        const updatedTrips = [
          ...trips.slice(0, index),
          newTrip,
          ...trips.slice(index + 1),
        ];
        console.log(
          "🚀 ~ file: trips.context.js ~ line 120 ~ updatedTrips",
          updatedTrips
        );
        setTrips(updatedTrips);
        // addToast(`Updated ${newTrip.title}`, {
        //   appearance: "success",
        // });
      } catch (err) {
        console.log(err);
        setError(err);
        addToast(`Error: Failed to update ${newTrip.title}`, {
          appearance: "error",
        });
      }
    },
    [accessToken, /* setError,*/ setLoading, setTrips, state]
  );

  const deleteTrip = useCallback(
    async (id) => {
      if (!accessToken) return;
      let deletedTrip = null;
      setLoading();
      const { trips } = state;
      try {
        const response = await fetch(`/api/v1/trips/${id}`, {
          method: "DELETE",
          headers: accessToken
            ? { ...headers, Authorization: `Bearer ${accessToken}` }
            : headers,
        });
        if (response.status !== 204) {
          throw response;
        }
        // Get index
        const index = trips.findIndex((trip) => trip._id === id);
        deletedTrip = trips[index];
        // recreate the trips array without that trip
        const updatedTrips = [
          ...trips.slice(0, index),
          ...trips.slice(index + 1),
        ];
        setTrips(updatedTrips);
        // addToast(`Deleted ${deletedTrip.title}`, {
        //   appearance: "success",
        // });
      } catch (err) {
        console.log(err);
        setError(err);
        // addToast(`Error: Failed to update ${deletedTrip.title}`, {
        //   appearance: "error",
        // });
      }
    },
    [accessToken, /*addToast,*/ setError, setLoading, setTrips, state]
  );

  return (
    <TripsContext.Provider
      value={{
        trips,
        loading,
        error,
        loaded,
        fetchTrips,
        addTrip,
        updateTrip,
        deleteTrip,
      }}
    >
      {props.children}
    </TripsContext.Provider>
  );
};
