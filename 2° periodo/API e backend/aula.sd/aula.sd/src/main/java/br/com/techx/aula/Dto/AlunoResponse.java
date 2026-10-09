package br.com.techx.aula.Dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class AlunoResponse {

    private long id;

    private String nome;
    private int idade;
    private int ra;
}
