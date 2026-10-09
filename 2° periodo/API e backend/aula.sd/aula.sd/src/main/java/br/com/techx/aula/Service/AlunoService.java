package br.com.techx.aula.Service;

import br.com.techx.aula.Repository.AlunoRepository;
import br.com.techx.aula.Dto.AlunoResponse;
import br.com.techx.aula.Model.Aluno;
import br.com.techx.aula.Dto.AlunoRequest;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class AlunoService {

    @Autowired
    private AlunoRepository alunoRepository;

    public List<Aluno> buscar() {
        return alunoRepository.findAll();
    }

    public void create(AlunoRequest alunoRequest) {
        Aluno entity = new Aluno();
        BeanUtils.copyProperties(alunoRequest, entity);
        alunoRepository.save(entity);
    }

    public AlunoResponse findById(Long id) {
        Aluno aluno = alunoRepository.findById(id).orElseThrow(()->new RuntimeException("id não encontrado"));
        return new AlunoResponse(aluno.getId(), aluno.getNome(), aluno.getIdade(), aluno.getRa());
    }
    public void update(long id, AlunoRequest alunoRequest) {
        Aluno entity = alunoRepository.findById(id).orElseThrow(() -> new RuntimeException("ERRO"));
        entity.setNome(alunoRequest.getNome());
        entity.setIdade(alunoRequest.getIdade());
        entity.setRa(alunoRequest.getRa());
        alunoRepository.save(entity);
    }
    public void delete(long id) {
        if (!alunoRepository.existsById(id)) {
            throw  new RuntimeException("ERRO");
        }
        alunoRepository.deleteById(id);
    }

}
