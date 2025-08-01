import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const MovieContext = createContext();

const initialState = {
  movies: [],
  currentMovie: null,
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 0,
    totalMovies: 0,
    hasNextPage: false,
    hasPrevPage: false
  },
  filters: {
    search: '',
    genre: '',
    featured: false
  }
};

const movieReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_MOVIES_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'FETCH_MOVIES_SUCCESS':
      return {
        ...state,
        movies: action.payload.movies,
        pagination: action.payload.pagination,
        loading: false,
        error: null
      };
    case 'FETCH_MOVIES_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case 'FETCH_MOVIE_SUCCESS':
      return {
        ...state,
        currentMovie: action.payload,
        loading: false,
        error: null
      };
    case 'SET_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload
        }
      };
    case 'CLEAR_FILTERS':
      return {
        ...state,
        filters: initialState.filters
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

export const MovieProvider = ({ children }) => {
  const [state, dispatch] = useReducer(movieReducer, initialState);

  const fetchMovies = async (page = 1, filters = {}) => {
    dispatch({ type: 'FETCH_MOVIES_START' });
    try {
      const params = new URLSearchParams({
        page,
        limit: 12,
        ...filters
      });

      const response = await axios.get(`/api/movies?${params}`);
      dispatch({
        type: 'FETCH_MOVIES_SUCCESS',
        payload: response.data
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch movies';
      dispatch({
        type: 'FETCH_MOVIES_FAILURE',
        payload: message
      });
      toast.error(message);
    }
  };

  const fetchMovie = async (id) => {
    dispatch({ type: 'FETCH_MOVIES_START' });
    try {
      const response = await axios.get(`/api/movies/${id}`);
      dispatch({
        type: 'FETCH_MOVIE_SUCCESS',
        payload: response.data.movie
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch movie';
      dispatch({
        type: 'FETCH_MOVIES_FAILURE',
        payload: message
      });
      toast.error(message);
    }
  };

  const setFilters = (filters) => {
    dispatch({
      type: 'SET_FILTERS',
      payload: filters
    });
  };

  const clearFilters = () => {
    dispatch({ type: 'CLEAR_FILTERS' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    movies: state.movies,
    currentMovie: state.currentMovie,
    loading: state.loading,
    error: state.error,
    pagination: state.pagination,
    filters: state.filters,
    fetchMovies,
    fetchMovie,
    setFilters,
    clearFilters,
    clearError
  };

  return (
    <MovieContext.Provider value={value}>
      {children}
    </MovieContext.Provider>
  );
};

export const useMovie = () => {
  const context = useContext(MovieContext);
  if (!context) {
    throw new Error('useMovie must be used within a MovieProvider');
  }
  return context;
}; 